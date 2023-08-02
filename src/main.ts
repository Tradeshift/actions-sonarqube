import {setFailed, endGroup, info, startGroup} from '@actions/core';
import {context} from '@actions/github';
import {promises as fs} from 'fs';
import process from 'process';
import {headSHA} from './git';
import {getInputs} from './inputs';
import {execSync} from 'child_process';
import * as sonarScanner from './sonar-scanner';
import * as maven from './maven';
import * as args from './args';

async function run(): Promise<void> {
  try {
    const inputs = await getInputs();
    startGroup('Selecting sonar host');
    let sonarHost =
      'http://sonarqube-default-sonarqube-0.sonarqube-default-sonarqube.default.svc.cluster.local:9000';
    const labels = process.env.RUNNER_LABELS;
    info(`Running on ${process.env.RUNNER_NAME}`);
    info(`Found runner labels: ${labels}`);
    if (!labels?.includes('self-hosted')) {
      info('Detected running on GH runners');
      if (!inputs.caCert) {
        throw new Error('ca-cert is required');
      }
      if (!inputs.clientCert) {
        throw new Error('client-cert is required');
      }
      if (!inputs.clientKey) {
        throw new Error('client-key is required');
      }
      // The data is base64 encoded so we first need to decode it
      const caCert = Buffer.from(inputs.caCert, 'base64');
      const clientCert = Buffer.from(inputs.clientCert, 'base64');
      const clientKey = Buffer.from(inputs.clientKey, 'base64');
      const caPromise = fs.writeFile('ca.crt', caCert);
      const clientPromise = fs.writeFile('client.crt', clientCert);
      const keyPromise = fs.writeFile('key', clientKey);
      await Promise.all([caPromise, clientPromise, keyPromise]);
      execSync(
        'openssl pkcs12 -export -in client.crt -inkey key -CAfile ca.crt -name "sonar.prod.tools.tradeshift.net" -out sonar.p12 -passout pass:123'
      );
      process.env['SONAR_SCANNER_OPTS'] =
        '-Djavax.net.ssl.keyStore=sonar.p12 -Djavax.net.ssl.keyStoreType=pkcs12 -Djavax.net.ssl.keyStorePassword=123';
      sonarHost = 'https://sonar.prod.tools.tradeshift.net';
    }

    endGroup();
    const sha = await headSHA();
    const sonarArgs = args.create(inputs, sonarHost, context, sha);

    switch (inputs.scanner) {
      case 'sonar-scanner':
        if (!inputs.sonarScannerVersion) {
          throw new Error(
            `sonar-scanner-version is required when using sonar-scanner`
          );
        }
        await sonarScanner.run(inputs.sonarScannerVersion, sonarArgs);
        break;
      case 'maven':
        await maven.run(sonarArgs);
        break;

      default:
        throw new Error(`unsupported scanner:${inputs.scanner}`);
    }
  } catch (error) {
    setFailed((error as Error).message);
  }
}

run();

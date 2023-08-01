import {setFailed, endGroup, info, startGroup} from '@actions/core';
import {context} from '@actions/github';
import {promises as fs} from 'fs';
import process from 'process';
import {headSHA} from './git';
import {getInputs} from './inputs';
import {spawnSync} from 'child_process';
import * as proxy from './proxy';
import * as sonarScanner from './sonar-scanner';
import * as maven from './maven';
import * as state from './state';
import * as args from './args';

async function run(): Promise<void> {
  try {
    if (state.isPost) {
      await post();
      return;
    }
    state.setIsPost();

    const inputs = await getInputs();
    startGroup('Selecting sonar host');
    let sonarHost = 'http://sonarqube:9000';
    const labels = process.env.RUNNER_LABELS;
    info(`Found labels: ${labels}`);
    if (!labels?.includes('self-hosted') && inputs.clientCert) {
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
      await fs.writeFile('ca.crt', inputs.caCert);
      await fs.writeFile('client.crt', inputs.clientCert);
      await fs.writeFile('key', inputs.clientKey);
      spawnSync(
        'openssl pkcs12 -export -in client.crt -inkey key -CAfile ca.crt-name "sonar.prod.tools.tradeshift.net" -out sonar.p12 -passout pass:123'
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

async function post(): Promise<void> {
  if (state.proxyContainer) {
    await proxy.log(state.proxyContainer);
    await proxy.stop(state.proxyContainer);
  }
}

run();

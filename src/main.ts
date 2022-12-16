import {setFailed} from '@actions/core';
import {context} from '@actions/github';
import {headSHA} from './git';
import {getInputs} from './inputs';
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
    if (!inputs.host) {
      throw new Error(`host is required`);
    }
    let sonarHost: string = inputs.host;
    if (inputs.clientCert) {
      sonarHost = await proxy.start(inputs);
    }

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

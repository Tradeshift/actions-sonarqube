import {setFailed, info} from '@actions/core';
import {context} from '@actions/github';
import {headSHA} from './git';
import {getInputs} from './inputs';
import process from 'process';
import * as sonarScanner from './sonar-scanner';
import * as maven from './maven';
import * as args from './args';

async function run(): Promise<void> {
  try {
    const inputs = await getInputs();
    if (!inputs.host) {
      throw new Error(`host is required`);
    }
    const env = process.env.RUNNER_NAME as string;
    info(env);

    const sha = await headSHA();
    const sonarArgs = args.create(inputs, inputs.host, context, sha);

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

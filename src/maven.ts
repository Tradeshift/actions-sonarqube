import {endGroup, startGroup} from '@actions/core';
import {getExecOutput} from '@actions/exec';

export async function run(args: string[]): Promise<void> {
  startGroup('Running Maven SonarScanner');
  const res = await getExecOutput('mvn', ['-B', 'sonar:sonar'].concat(args));
  if (res.stderr !== '' && res.exitCode) {
    throw new Error(`failed maven execution: ${res.stderr}`);
  }
  endGroup();
}

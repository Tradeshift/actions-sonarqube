import {endGroup, startGroup} from '@actions/core';
import {exec} from '@tradeshift/actions-exec';

export async function run(args: string[]): Promise<void> {
  startGroup('Running Maven SonarScanner');
  const res = await exec('mvn', ['-B', 'sonar:sonar'].concat(args), false);
  if (res.stderr !== '' && !res.success) {
    throw new Error(`failed maven execution: ${res.stderr}`);
  }
  endGroup();
}

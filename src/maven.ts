import {endGroup, startGroup} from '@actions/core';
import {getExecOutput} from '@actions/exec';

export async function run(version: string, args: string[]): Promise<void> {
  startGroup('Running Maven SonarScanner');
  const res = await getExecOutput(
    'mvn',
    [
      '-B',
      `org.sonarsource.scanner.maven:sonar-maven-plugin:${version}:sonar`
    ].concat(args)
  );
  if (res.stderr !== '' && res.exitCode) {
    throw new Error(`failed maven execution: ${res.stderr}`);
  }
  endGroup();
}

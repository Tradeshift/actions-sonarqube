import * as exec from '@actions/exec';
import {run} from '../src/maven';
jest.mock('@actions/core');
jest.mock('@actions/exec');

describe(run, () => {
  it('runs the fully-qualified sonar-maven-plugin goal with the given version', async () => {
    jest
      .spyOn(exec, 'getExecOutput')
      .mockResolvedValue({exitCode: 0, stdout: '', stderr: ''});
    await run('5.7.0.6970', ['-Dsonar.token=t']);
    expect(exec.getExecOutput).toHaveBeenCalledWith('mvn', [
      '-B',
      'org.sonarsource.scanner.maven:sonar-maven-plugin:5.7.0.6970:sonar',
      '-Dsonar.token=t'
    ]);
  });
});

import {getExecOutput} from '@actions/exec';

export async function headSHA(): Promise<string> {
  const res = await getExecOutput('git', ['rev-parse', 'HEAD'], {silent: true});
  if (res.stderr !== '' && res.exitCode) {
    throw new Error(`could not get git head sha: ${res.stderr}`);
  }

  return res.stdout.trim();
}

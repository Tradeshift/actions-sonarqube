import {getExecOutput} from '@actions/exec';

export async function fetchRef(ref: string): Promise<string> {
  const args = ['fetch', 'origin', `+refs/heads/${ref}:refs/heads/${ref}`]
  const res = await getExecOutput('git', args, {silent: true});
  if (res.stderr !== '' && res.exitCode) {
    throw new Error(`could not get git head sha: ${res.stderr}`);
  }

  return res.stdout.trim();
}

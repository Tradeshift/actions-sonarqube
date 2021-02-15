import {exec} from './exec';

export async function headSHA(): Promise<string> {
  const res = await exec('git', ['rev-parse', 'HEAD'], true);
  if (res.stderr !== '' && !res.success) {
    throw new Error(`could not get git head sha: ${res.stderr}`);
  }

  return res.stdout.trim();
}

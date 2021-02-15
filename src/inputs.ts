import csvparse from 'csv-parse/lib/sync';
import * as core from '@actions/core';

export interface Inputs {
  args: string[];
  caCert: string;
  clientCert: string;
  clientKey: string;
  host: string;
  scanner: string;
  sonarProxyImage: string;
  sonarScannerVersion: string;
  token: string;
}

export async function getInputs(): Promise<Inputs> {
  const inputs: Inputs = {
    args: await getInputList('args'),
    caCert: core.getInput('ca-cert'),
    clientCert: core.getInput('client-cert'),
    clientKey: core.getInput('client-key'),
    host: core.getInput('host'),
    scanner: core.getInput('scanner'),
    sonarProxyImage: core.getInput('sonar-proxy-image'),
    sonarScannerVersion: core.getInput('sonar-scanner-version'),
    token: core.getInput('token')
  };
  return inputs;
}

export async function getInputList(
  name: string,
  ignoreComma = false
): Promise<string[]> {
  const res: string[] = [];

  const items = core.getInput(name);
  if (items === '') {
    return res;
  }

  const parsed: string[][] = await csvparse(items, {
    columns: false,
    relaxColumnCount: true,
    skipLinesWithEmptyValues: true
  });

  for (const output of parsed) {
    if (output.length === 1) {
      res.push(output[0]);
      continue;
    } else if (!ignoreComma) {
      res.push(...output);
      continue;
    }
    res.push(output.join(','));
  }

  return res.filter(item => item).map(pat => pat.trim());
}

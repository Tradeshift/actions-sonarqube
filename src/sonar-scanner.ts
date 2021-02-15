import {addPath, debug, endGroup, info, startGroup} from '@actions/core';
import {which} from '@actions/io';
import * as tc from '@actions/tool-cache';
import {exec} from './exec';
import {Inputs} from './inputs';

export async function run(inputs: Inputs, args: string[]): Promise<void> {
  if (!(await isAvailable(inputs.sonarScannerVersion))) {
    await install(inputs.sonarScannerVersion);
  }

  startGroup('Running SonarScanner');
  const res = await exec('sonar-scanner', args, false);
  if (res.stderr !== '' && !res.success) {
    throw new Error(res.stderr);
  }
  endGroup();
}

async function isAvailable(version: string): Promise<boolean> {
  let sonarScannerPath: string;
  try {
    sonarScannerPath = await which('sonar-scanner', true);
  } catch {
    return false;
  }
  debug(`found sonar-scannr on path: ${sonarScannerPath}`);

  const res = await exec(sonarScannerPath, ['--version'], true);
  if (res.stderr !== '' && !res.success) {
    throw new Error(`could not get sonar version: ${res.stderr}`);
  }

  const matches = res.stdout.match(/^INFO: SonarScanner (.*)$/m);
  if (!matches) {
    throw new Error(
      `could not extract sonar version from output: ${res.stdout}`
    );
  }

  debug(`${sonarScannerPath} version: ${matches[1]}`);
  return matches[1] === version;
}

async function install(version: string): Promise<void> {
  startGroup('Installing SonarScanner');
  let sonarDirectory = tc.find('sonar-scanner', version);
  if (!sonarDirectory) {
    info(`SonarScanner version ${version} not found in cache. Downloading...`);
    sonarDirectory = await download(version);
  }
  addPath(`${sonarDirectory}/sonar-scanner-${version}-linux/bin`);
  info(`Successfully installed SonarScanner ${version}`);
  endGroup();
}

async function download(version: string): Promise<string> {
  const sonarPath = await tc.downloadTool(
    `https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${version}-linux.zip`
  );
  info('Extracting');
  const sonarExtractedPath = await tc.extractZip(sonarPath);
  info('Saving to cache');
  const sonarCachedPath = await tc.cacheDir(
    sonarExtractedPath,
    'sonar-scanner',
    version
  );
  return sonarCachedPath;
}

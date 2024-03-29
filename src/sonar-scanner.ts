import {addPath, debug, endGroup, info, startGroup} from '@actions/core';
import {getExecOutput} from '@actions/exec';
import {which} from '@actions/io';
import * as tc from '@actions/tool-cache';

export async function run(version: string, args: string[]): Promise<void> {
  if (!(await isAvailable(version))) {
    await install(version);
  }

  startGroup('Running SonarScanner');
  const res = await getExecOutput('sonar-scanner', args);
  if (res.stderr !== '' && res.exitCode) {
    throw new Error(`failed sonar scanner execution: ${res.stderr}`);
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
  debug(`found sonar-scanner on path: ${sonarScannerPath}`);

  const res = await getExecOutput(sonarScannerPath, ['--version'], {
    silent: true
  });
  if (res.stderr !== '' && res.exitCode) {
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

import {debug, endGroup, info, startGroup, warning} from '@actions/core';
import {exec} from '@tradeshift/actions-exec';
import {Inputs} from './inputs';
import {setProxyContainer} from './state';

export async function start(inputs: Inputs): Promise<string> {
  startGroup('Starting sonar proxy');
  if (!inputs.sonarProxyImage) {
    throw new Error('sonar-proxy-image is required');
  }
  if (!inputs.caCert) {
    throw new Error('ca-cert is required');
  }
  if (!inputs.clientCert) {
    throw new Error('client-cert is required');
  }
  if (!inputs.clientKey) {
    throw new Error('client-key is required');
  }
  const args = [
    'run',
    '--rm',
    '-d',
    '-e',
    `CACERT=${inputs.caCert}`,
    '-e',
    `CERT=${inputs.clientCert}`,
    '-e',
    `KEY=${inputs.clientKey}`,
    '-e',
    `SONAR_HOST=${inputs.host}`,
    inputs.sonarProxyImage
  ];
  const res = await exec('docker', args, true);
  if (res.stderr !== '' && !res.success) {
    throw new Error(`could not start sonar proxy container: ${res.stderr}`);
  }

  const containerID = res.stdout.trim();
  setProxyContainer(containerID);

  const proxyIP = await getIP(containerID);
  const host = `http://${proxyIP}:9000`;
  info(`Proxy container: ${containerID}`);
  info(`Proxy container IP: ${proxyIP}`);
  info(`Proxy container host: ${host}`);

  endGroup();
  return host;
}

export async function stop(containerID: string): Promise<void> {
  info('Stopping sonar proxy');
  const res = await exec('docker', ['stop', containerID], false);
  if (res.stderr !== '' && !res.success) {
    warning(`could not stop sonar proxy: ${res.stderr}`);
  }
  return;
}

interface inspectObj {
  NetworkSettings: {
    Networks: {
      bridge: {
        IPAddress: string;
      };
    };
  };
}

async function getIP(containerID: string): Promise<string> {
  const res = await exec('docker', ['inspect', containerID], true);
  if (res.stderr !== '' && !res.success) {
    throw new Error('could not inspect docker container');
  }

  debug(res.stdout.trim());

  const obj: inspectObj[] = JSON.parse(res.stdout.trim());
  if (!obj || !obj[0].NetworkSettings.Networks.bridge.IPAddress) {
    throw new Error('ip adress of proxy container could not be determined');
  }

  return obj[0].NetworkSettings.Networks.bridge.IPAddress;
}

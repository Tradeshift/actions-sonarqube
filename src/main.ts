import {endGroup, info, setFailed, startGroup} from '@actions/core';
import {context} from '@actions/github';
import {Context} from '@actions/github/lib/context';
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema';
import {headSHA} from './git';
import {getInputs, Inputs} from './inputs';
import * as proxy from './proxy';
import * as sonarScanner from './sonar-scanner';
import * as state from './state';

async function run(): Promise<void> {
  try {
    if (state.isPost) {
      await post();
      return;
    }
    state.setIsPost();

    const inputs = await getInputs();
    const sonarHost = await proxy.start(inputs);
    const sha = await headSHA();
    const args = createArgs(inputs, sonarHost, context, sha);

    switch (inputs.scanner) {
      case 'sonar-scanner':
        if (!inputs.sonarScannerVersion) {
          throw new Error(
            `sonar-scanner-version is required when using sonar-scanner`
          );
        }
        await sonarScanner.run(inputs.sonarScannerVersion, args);
        break;
      default:
        throw new Error(`unsupported scanner:${inputs.scanner}`);
    }
  } catch (error) {
    setFailed(error.message);
  }
}

async function post(): Promise<void> {
  await proxy.stop(state.proxyContainer);
}

export function createArgs(
  inputs: Inputs,
  sonarHost: string,
  ctx: Context,
  sha: string
): string[] {
  startGroup('Building Sonar arguments');
  const args = [
    `-Dsonar.login=${inputs.token}`,
    '-Dsonar.sourceEncoding=UTF-8',
    `-Dsonar.projectKey=${ctx.repo.repo}`,
    `-Dsonar.host.url=${sonarHost}`,
    `-Dsonar.scm.revision=${sha}`
  ];

  if (ctx.eventName === 'pull_request') {
    const payload = ctx.payload as PullRequestEvent;
    info(`Running pull request analysis. PR: ${payload.pull_request.number}`);
    args.push(
      `-Dsonar.pullrequest.key=${payload.pull_request.number}`,
      `-Dsonar.pullrequest.branch=${payload.pull_request.head.ref}`,
      `-Dsonar.pullrequest.base=${payload.pull_request.base.ref}`,
      `-Dsonar.pullrequest.github.repository=${ctx.repo.owner}/${ctx.repo.repo}`
    );
  } else {
    info(`Running branch analysis. Branch: ${ctx.ref}`);
    args.push(`-Dsonar.branch.name=${ctx.ref.replace(/^(refs\/heads\/)/, '')}`);
  }

  if (inputs.args) {
    args.push(...inputs.args);
  }
  endGroup();
  return args;
}

run();

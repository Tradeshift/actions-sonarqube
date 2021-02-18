import {endGroup, info, setFailed, startGroup} from '@actions/core';
import {context} from '@actions/github';
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
    const args = await createArgs(inputs, sonarHost);

    switch (inputs.scanner) {
      case 'sonar-scanner':
        await sonarScanner.run(inputs, args);
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

async function createArgs(
  inputs: Inputs,
  sonarHost: string
): Promise<string[]> {
  startGroup('Building Sonar arguments');
  const args = [
    `-Dsonar.login=${inputs.token}`,
    '-Dsonar.sourceEncoding=UTF-8',
    `-Dsonar.projectKey=${context.repo.repo}`,
    `-Dsonar.host.url=${sonarHost}`,
    `-Dsonar.scm.revision=${await headSHA()}`
  ];

  if (context.eventName === 'pull_request') {
    const payload = context.payload as PullRequestEvent;
    info(`Running pull request analysis. PR: ${payload.pull_request.number}`);
    args.push(
      `-Dsonar.pullrequest.key=${payload.pull_request.number}`,
      `-Dsonar.pullrequest.branch=${payload.pull_request.head.ref}`,
      `-Dsonar.pullrequest.base=${payload.pull_request.base.ref}`,
      `-Dsonar.pullrequest.github.repository=${context.repo.owner}/${context.repo.repo}`
    );
  } else {
    info(`Running branch analysis. Branch: ${context.ref}`);
    args.push(
      `-Dsonar.branch.name=${context.ref.replace(/^(refs\/heads\/)/, '')}`
    );
  }

  args.push(...inputs.args);
  endGroup();
  return args;
}

run();

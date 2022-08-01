import {endGroup, info, startGroup} from '@actions/core';
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'; // eslint-disable-line import/no-unresolved
import {Context} from '@actions/github/lib/context';

import {Inputs} from './inputs';

export function create(
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

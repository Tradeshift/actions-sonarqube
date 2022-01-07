import {getInput, info} from '@actions/core';
import {getOctokit, context} from '@actions/github';

export async function removeCommentsOlderThan(
  deletionCutoff: Date
): Promise<void> {
  const token = getInput('github-token');
  // guard against running on master / without token
  if (!context.issue?.number) {
    info(`${context.issue?.number}`);
    info(`Skipping comment cleanup on non-pr build`);
    return;
  }
  if (!token) {
    info(`Skipping comment cleanup, no github-token provided`);
    return;
  }
  const github = getOctokit(token);
  const comments = await github.paginate(github.rest.issues.listComments, {
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo
  });

  for (const comment of comments) {
    if (
      comment.user?.login === 'ts-sonarqube[bot]' &&
      new Date(comment.created_at) < deletionCutoff
    ) {
      info(`Deleting comment ${comment.id} by ${comment.user.login}`);
      await github.rest.issues.deleteComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: comment.id
      });
    }
  }
}

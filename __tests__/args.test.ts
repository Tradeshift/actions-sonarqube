import {Context} from '@actions/github/lib/context';
import {Inputs} from '../src/inputs';
import {create} from '../src/args';

describe(create, () => {
  let inputs: Inputs;
  let ctx: Context;

  beforeEach(() => {
    inputs = <Inputs>{
      token: 'token'
    };
    ctx = <Context>{
      repo: {
        owner: 'owner',
        repo: 'repo'
      },
      ref: 'refs/heads/my-branch'
    };
  });

  it('should always set default args', () => {
    const args = create(inputs, 'test.com', ctx, 'sha');
    expect(args).toContain('-Dsonar.login=token');
    expect(args).toContain('-Dsonar.sourceEncoding=UTF-8');
    expect(args).toContain('-Dsonar.projectKey=repo');
    expect(args).toContain('-Dsonar.host.url=test.com');
    expect(args).toContain('-Dsonar.scm.revision=sha');
  });

  it('should detect pull_request and set PR args', () => {
    ctx.eventName = 'pull_request';
    ctx.payload = {
      pull_request: {
        number: 42,
        head: {
          ref: 'my-branch'
        },
        base: {
          ref: 'master'
        }
      }
    };
    const args = create(inputs, 'test.com', ctx, 'sha');
    expect(args).toContain('-Dsonar.pullrequest.key=42');
    expect(args).toContain('-Dsonar.pullrequest.branch=my-branch');
    expect(args).toContain('-Dsonar.pullrequest.base=master');
    expect(args).toContain('-Dsonar.pullrequest.github.repository=owner/repo');
    expect(args).not.toContain('-Dsonar.branch.name=my-branch');
  });

  it('should set the branch name when not a PR', () => {
    ctx.eventName = 'push';
    const args = create(inputs, 'test.com', ctx, 'sha');
    expect(args).toContain('-Dsonar.branch.name=my-branch');
    expect(args).not.toContain('-Dsonar.pullrequest.branch=my-branch');
  });

  it('should add additional args', () => {
    inputs.args = ['arg1', 'arg2'];
    const args = create(inputs, 'test.com', ctx, 'sha');
    expect(args).toContain('arg1');
    expect(args).toContain('arg2');
  });
});

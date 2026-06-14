const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');

async function tagRelease(version, options = {}) {
  const {
    commitMessage,
    tagName,
    tagMessage,
  } = options;

  const token = core.getInput('github-token');
  const payload = github.context.payload;
  const userName = core.getInput('user-name') || payload.head_commit?.author?.name || 'github-actions[bot]';
  const userEmail = core.getInput('user-email') || payload.head_commit?.author?.email || 'github-actions[bot]@users.noreply.github.com';

  core.info(`Git user name: ${userName}`);
  core.info(`Git user email: ${userEmail}`);

  const git = simpleGit();
  await git.addConfig('user.name', userName);
  await git.addConfig('user.email', userEmail);

  const finalCommitMessage = commitMessage || `chore(release): v${version}`;
  const finalTagName = tagName || `v${version}`;
  const finalTagMessage = tagMessage || `Release ${finalTagName}`;

  await git.add('.');
  await git.commit(finalCommitMessage);
  await git.addTag(finalTagName, '-a', '-m', finalTagMessage);
  await git.push();
  await git.pushTags();

  core.info(`Tagged release: ${finalTagName}`);
}

module.exports = {
  tagRelease,
};

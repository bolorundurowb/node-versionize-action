const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');

async function tagRelease(version) {
  const token = core.getInput('github-token');
  // const git = github.getOctokit(token);
  const payload = github.context.payload;
  const userName = core.getInput('user-name') ?? payload.head_commit.author.name;
  const userEmail = core.getInput('user-email') ?? payload.head_commit.author.email;

  const git = simpleGit();
  git.addConfig('user.name', userName);
  git.addConfig('user.email', userEmail);

  await git.add('.');
  await git.commit(`(chore): release v${version}`);
  await git.addTag(version);
  await git.push();
  await git.pushTags();
}

module.exports = {
  tagRelease
};

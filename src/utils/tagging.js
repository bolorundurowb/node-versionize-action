const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');

async function tagRelease(version) {
  const token = core.getInput('github-token');
  // const git = github.getOctokit(token);
  const context = github.context;
  // const userName =
  core.debug(token);
  core.debug(JSON.stringify(context));
  const git = simpleGit();
  await git.commit(`(chore): release v${version}`);
  await git.addTag(version);
  await git.push();
  await git.pushTags();
}

module.exports = {
  tagRelease
};

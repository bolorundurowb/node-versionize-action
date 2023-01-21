const core = require('@actions/core');
const simpleGit = require('simple-git');

async function tagRelease(version) {
  const git = simpleGit();
  await git.commit(`(chore): release v${version}`);
  await git.addTag(version);
  await git.push();
  await git.pushTags();
}

module.exports = {
  tagRelease
};

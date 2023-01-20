const simpleGit = require('simple-git');

function tagRelease(version) {
  const git = simpleGit();
  git.commit(`(chore): release v${version}`);
  git.addTag(version);
}

module.exports = {
  tagRelease
};

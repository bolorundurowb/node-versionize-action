const git = require('simple-git');

function tagRelease(version) {
  git().addTag(version);
}

module.exports = {
  tagRelease
};

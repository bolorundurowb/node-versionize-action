const core = require('@actions/core');
const github = require('@actions/github');

const { tagRelease } = require('./utils/tagging');
const { findPackageJsonFiles } = require('./utils/file-system');
const { upgradeFileVersion } = require('./utils/file-versioning');

const validBumpTypes = ['major', 'minor', 'patch'];

function run() {
  try {
    const bumpType = 'major';

    if (!validBumpTypes.includes(bumpType)) {
      core.setFailed(`'${bumpType}' is not a valid bump type. Valid types are: ${validBumpTypes}.`);
      return;
    }

    const rawTraverseDirs = core.getInput('traverse-dirs');
    const traverseDirs = rawTraverseDirs?.toLowerCase() === 'true';

    let tagVersion;
    const filePaths = findPackageJsonFiles(traverseDirs);

    if (filePaths.size === 0) {
      core.setFailed('No package.lock files found.');
      return;
    }

    for (const filePath of filePaths) {
      tagVersion = upgradeFileVersion(filePath, bumpType);
    }

    tagRelease(tagVersion);
    core.setOutput('version', tagVersion);
  } catch (e) {
    core.setFailed(e);
  }
}

run();

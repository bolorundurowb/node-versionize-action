const core = require('@actions/core');

const { tagRelease } = require('./utils/tagging');
const { findPackageJsonFiles } = require('./utils/file-system');
const { upgradeFileVersion } = require('./utils/file-versioning');

const validBumpTypes = ['major', 'minor', 'patch'];

async function run() {
  core.startGroup('Validating user inputs');
  const bumpType = core.getInput('bump-type');

  if (!validBumpTypes.includes(bumpType)) {
    core.setFailed(`'${bumpType}' is not a valid bump type. Valid types are: ${validBumpTypes}.`);
    return;
  }

  const rawTraverseDirs = core.getInput('traverse-dirs');
  const traverseDirs = rawTraverseDirs?.toLowerCase() === 'true';

  core.info(`Bump type: ${bumpType}`);
  core.info(`Traverse dirs: ${traverseDirs}`);
  core.endGroup();

  core.startGroup('Discovering package.json files.');
  const filePaths = findPackageJsonFiles(traverseDirs);

  if (filePaths.size === 0) {
    core.setFailed('No package.lock files found.');
    return;
  }

  core.info(`Files found: ${filePaths.size}`);
  core.info(`File paths: ${JSON.stringify(filePaths)}`);
  core.endGroup();

  core.startGroup('Validating user inputs');
  let tagVersion;
  for (const filePath of filePaths) {
    tagVersion = upgradeFileVersion(filePath, bumpType);
  }

  await tagRelease(tagVersion);

  core.info(`Version: ${tagVersion}`);
  core.endGroup();

  core.setOutput('version', tagVersion);
}

run()
  .then(() => {
    core.info('Run completed successfully.');
  }).catch((e) => {
  core.setFailed(e);
});

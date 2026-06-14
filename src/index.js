const core = require('@actions/core');

const { tagRelease } = require('./utils/tagging');
const { findPackageJsonFiles, detectWorkspaces } = require('./utils/file-system');
const { upgradeFileVersion } = require('./utils/file-versioning');
const { detectBumpFromCommits } = require('./utils/conventional-commits');
const { generateAndWriteChangelog } = require('./utils/changelog');
const { runPreReleaseHook, runPostReleaseHook } = require('./utils/hooks');

const validBumpTypes = ['major', 'minor', 'patch', 'auto'];

async function run() {
  core.startGroup('Configuration');
  const bumpTypeInput = core.getInput('bump-type') || 'patch';
  const traverseDirsInput = core.getInput('traverse-dirs');
  const traverseDirs = traverseDirsInput?.toLowerCase() === 'true';
  const packagePaths = core.getInput('package-paths');
  const generateChangelog = core.getInput('generate-changelog')?.toLowerCase() === 'true';
  const changelogIncludeHash = core.getInput('changelog-include-hash')?.toLowerCase() === 'true';
  const preReleaseHook = core.getInput('pre-release-hook');
  const postReleaseHook = core.getInput('post-release-hook');
  const tagPrefix = core.getInput('tag-prefix') || 'v';
  const commitMessageFormat = core.getInput('commit-message-format');
  const useWorkspaces = core.getInput('use-workspaces')?.toLowerCase() === 'true';

  core.info(`Bump type: ${bumpTypeInput}`);
  core.info(`Traverse dirs: ${traverseDirs}`);
  core.info(`Package paths: ${packagePaths || '(auto-detect)'}`);
  core.info(`Generate changelog: ${generateChangelog}`);
  core.info(`Use workspaces: ${useWorkspaces}`);
  core.info(`Tag prefix: ${tagPrefix}`);
  core.endGroup();

  let bumpType = bumpTypeInput;

  if (bumpType === 'auto') {
    core.startGroup('Detecting bump type from conventional commits');
    const detection = await detectBumpFromCommits('patch');
    bumpType = detection.bumpType;
    core.info(`Detected bump type: ${bumpType} (from ${detection.commitCount} commits)`);
    core.info(`Parsed commits: ${detection.parsedCommits.length}`);
    core.setOutput('parsed-commits', JSON.stringify(detection.parsedCommits));
    core.endGroup();
  }

  if (!validBumpTypes.includes(bumpType)) {
    core.setFailed(`'${bumpType}' is not a valid bump type. Valid types are: ${validBumpTypes}.`);
    return;
  }

  core.startGroup('Discovering package.json files');
  let filePaths;

  if (useWorkspaces) {
    const workspaceFiles = detectWorkspaces();
    if (workspaceFiles.length > 0) {
      core.info(`Found ${workspaceFiles.length} workspace packages`);
      filePaths = new Set(workspaceFiles);
    } else {
      filePaths = findPackageJsonFiles(traverseDirs, packagePaths);
    }
  } else {
    filePaths = findPackageJsonFiles(traverseDirs, packagePaths);
  }

  if (filePaths.size === 0) {
    core.setFailed('No package.json files found.');
    return;
  }

  core.info(`Files found: ${filePaths.size}`);
  core.info(`File paths: ${JSON.stringify([...filePaths])}`);
  core.endGroup();

  let tagVersion;
  core.startGroup('Bumping versions');
  for (const filePath of filePaths) {
    tagVersion = upgradeFileVersion(filePath, bumpType);
    core.info(`Updated ${filePath} to ${tagVersion}`);
  }
  core.endGroup();

  if (preReleaseHook) {
    await runPreReleaseHook(preReleaseHook, tagVersion);
  }

  if (generateChangelog) {
    core.startGroup('Generating changelog');
    const { parsedCommits } = await detectBumpFromCommits('patch');
    generateAndWriteChangelog(tagVersion, parsedCommits, {
      includeHash: changelogIncludeHash,
    });
    core.info('Changelog generated successfully');
    core.endGroup();
  }

  core.startGroup('Creating git tag and pushing');
  const tagName = `${tagPrefix}${tagVersion}`;
  let commitMessage;

  if (commitMessageFormat) {
    commitMessage = commitMessageFormat.replace(/\{version\}/g, tagVersion).replace(/\{tag\}/g, tagName);
  } else {
    commitMessage = `chore(release): ${tagName}`;
  }

  await tagRelease(tagVersion, {
    commitMessage,
    tagName,
    tagMessage: `Release ${tagName}`,
  });
  core.endGroup();

  if (postReleaseHook) {
    await runPostReleaseHook(postReleaseHook, tagVersion);
  }

  core.setOutput('version', tagVersion);
  core.setOutput('tag', tagName);
}

run()
  .then(() => {
    core.info('Run completed successfully.');
  })
  .catch((e) => {
    core.setFailed(e);
  });

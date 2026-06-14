const { execSync } = require('child_process');
const core = require('@actions/core');

async function runHook(hookScript, version, hookName) {
  if (!hookScript || hookScript.trim() === '') {
    return;
  }

  core.startGroup(`Running ${hookName} hook`);
  core.info(`Executing: ${hookScript}`);

  const env = {
    ...process.env,
    VERSIONIZE_VERSION: version,
    VERSIONIZE_HOOK: hookName,
  };

  try {
    const output = execSync(hookScript, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    if (output) {
      core.info(output);
    }

    core.info(`${hookName} hook completed successfully`);
  } catch (error) {
    core.error(`${hookName} hook failed:`);
    if (error.stdout) core.info(error.stdout);
    if (error.stderr) core.error(error.stderr);
    throw new Error(`${hookName} hook failed with exit code ${error.status}`);
  } finally {
    core.endGroup();
  }
}

async function runPreReleaseHook(hookScript, version) {
  await runHook(hookScript, version, 'pre-release');
}

async function runPostReleaseHook(hookScript, version) {
  await runHook(hookScript, version, 'post-release');
}

module.exports = {
  runHook,
  runPreReleaseHook,
  runPostReleaseHook,
};

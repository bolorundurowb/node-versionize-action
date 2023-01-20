const core = require('@actions/core');
const github = require('@actions/github');

const validBumpTypes = ['major', 'minor', 'patch'];

try {
  const bumpType = core.getInput('bump-type');

  if (!validBumpTypes.includes(bumpType)) {
    core.setFailed(`'${bumpType}' is not a valid bump type. Valid types are: ${validBumpTypes}.`);
    return;
  }

  const rawTraverseDirs = core.getInput('traverse-dirs')
  const traverseDirs = rawTraverseDirs?.toLowerCase() === 'true';

} catch (e) {
  core.setFailed(e);
}

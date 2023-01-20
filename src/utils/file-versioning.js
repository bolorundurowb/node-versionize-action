const fs = require('fs');
const parseVersion = require('parse-version-string').default;

function upgradeFileVersion(packageJsonFilePath, bumpType) {
  const rawContents = fs.readFileSync(packageJsonFilePath, 'utf8');
  const contents = JSON.parse(rawContents);
  const rawCurrentVersion = contents.version;
  const currentVersion = parseVersion(rawCurrentVersion);

  if (bumpType === 'major') {
    currentVersion.major += 1;
    currentVersion.minor = 0;
    currentVersion.patch = 0;
  } else if (bumpType === 'minor') {
    currentVersion.minor += 1;
    currentVersion.patch = 0;
  } else {
    currentVersion.patch += 1;
  }

  contents.version = `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`;
  fs.writeFileSync(packageJsonFilePath, JSON.stringify(contents, null, '  '), 'utf8');

  return contents.version;
}

module.exports = {
  upgradeFileVersion
};

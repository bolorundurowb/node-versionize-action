const fs = require('fs');
const path = require('path');

function findPackageJsonFiles(traverseDirs) {
  const currentDir = process.cwd();
  return fromDirectory(currentDir, traverseDirs);
}

function fromDirectory(dirPath, traverseDirs) {
  let foundPaths = new Set();

  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(dirPath, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory() && traverseDirs) {
     foundPaths =  new Set([...foundPaths, ...(fromDirectory(filename))]);
    } else if (files[i] === 'package.json') {
      foundPaths.add(filename);
    }
  }

  return foundPaths;
}

module.exports = {
  findPackageJsonFiles
};

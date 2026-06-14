const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

function findPackageJsonFiles(traverseDirs, packagePaths = '') {
  const currentDir = process.cwd();

  if (packagePaths && packagePaths.trim() !== '') {
    core.info('Using explicitly provided package.json paths');
    const explicitPaths = packagePaths
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => path.resolve(currentDir, p));

    const validPaths = explicitPaths.filter((p) => {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.isFile() && path.basename(p) === 'package.json') {
          return true;
        }
        if (stat.isDirectory()) {
          const pkgJson = path.join(p, 'package.json');
          return fs.existsSync(pkgJson);
        }
      }
      return false;
    }).map((p) => {
      const stat = fs.statSync(p);
      return stat.isDirectory() ? path.join(p, 'package.json') : p;
    });

    return new Set(validPaths);
  }

  return fromDirectory(currentDir, traverseDirs);
}

function fromDirectory(dirPath, traverseDirs) {
  let foundPaths = new Set();

  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(dirPath, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory() && traverseDirs) {
      const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
      if (!skipDirs.includes(files[i])) {
        foundPaths = new Set([...foundPaths, ...fromDirectory(filename, traverseDirs)]);
      }
    } else if (files[i] === 'package.json') {
      foundPaths.add(filename);
    }
  }

  return foundPaths;
}

function detectWorkspaces() {
  const currentDir = process.cwd();
  const rootPackageJson = path.join(currentDir, 'package.json');

  if (!fs.existsSync(rootPackageJson)) {
    return [];
  }

  try {
    const contents = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
    const workspaces = contents.workspaces;

    if (!workspaces) {
      return [];
    }

    const workspaceDirs = [];
    const patterns = Array.isArray(workspaces) ? workspaces : (workspaces.packages || []);

    for (const pattern of patterns) {
      const globbed = globPattern(currentDir, pattern);
      workspaceDirs.push(...globbed);
    }

    return workspaceDirs;
  } catch {
    return [];
  }
}

function globPattern(baseDir, pattern) {
  const results = [];
  const parts = pattern.split('/');

  function scan(currentPath, partIndex) {
    if (partIndex >= parts.length) {
      const pkgJson = path.join(currentPath, 'package.json');
      if (fs.existsSync(pkgJson)) {
        results.push(pkgJson);
      }
      return;
    }

    const part = parts[partIndex];
    if (part === '**') {
      scanAllDirs(currentPath, partIndex);
    } else if (part.includes('*')) {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && matchesPattern(file, part)) {
          scan(fullPath, partIndex + 1);
        }
      }
    } else {
      const fullPath = path.join(currentPath, part);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath, partIndex + 1);
        }
      }
    }
  }

  function scanAllDirs(currentPath, partIndex) {
    scan(currentPath, partIndex + 1);

    try {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(file)) {
          scanAllDirs(fullPath, partIndex);
        }
      }
    } catch {
    }
  }

  function matchesPattern(name, pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(name);
  }

  scan(baseDir, 0);
  return results;
}

module.exports = {
  findPackageJsonFiles,
  detectWorkspaces,
};

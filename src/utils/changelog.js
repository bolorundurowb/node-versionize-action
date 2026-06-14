const fs = require('fs');
const path = require('path');

const TYPE_LABELS = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  refactor: 'Refactors',
  docs: 'Documentation',
  style: 'Styles',
  test: 'Tests',
  ci: 'CI/CD',
  build: 'Build System',
  chore: 'Chores',
  revert: 'Reverts',
};

function formatCommitMessage(message) {
  return message.replace(/^(feat|fix|chore|docs|style|refactor|perf|test|ci|build|revert)(\(.+\))?!?:\s*/, '');
}

function groupCommitsByType(commits) {
  const grouped = {};

  for (const commit of commits) {
    const type = commit.type || 'chore';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(commit);
  }

  return grouped;
}

function generateChangelogEntry(version, date, commits, includeHash = false) {
  const grouped = groupCommitsByType(commits);
  const sections = [];

  const orderedTypes = ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'ci', 'build', 'chore', 'revert'];

  for (const type of orderedTypes) {
    if (grouped[type] && grouped[type].length > 0) {
      const label = TYPE_LABELS[type] || type;
      const commitLines = grouped[type].map((commit) => {
        const scope = commit.scope ? `**${commit.scope}:** ` : '';
        const hash = includeHash ? ` (${commit.hash.substring(0, 7)})` : '';
        const breaking = commit.breaking ? ' **BREAKING**' : '';
        return `- ${scope}${formatCommitMessage(commit.message)}${hash}${breaking}`;
      });

      sections.push(`### ${label}\n\n${commitLines.join('\n')}`);
    }
  }

  if (sections.length === 0) {
    sections.push('### Other\n\n- No significant changes');
  }

  return `## [${version}] - ${date}\n\n${sections.join('\n\n')}`;
}

function readExistingChangelog(changelogPath) {
  if (fs.existsSync(changelogPath)) {
    return fs.readFileSync(changelogPath, 'utf8');
  }
  return null;
}

function writeChangelog(changelogPath, newEntry, existingContent, keepUnreleased = true) {
  let content = '';

  if (existingContent) {
    if (keepUnreleased && existingContent.includes('## [Unreleased]')) {
      const unreleasedIndex = existingContent.indexOf('## [Unreleased]');
      const nextHeaderIndex = existingContent.indexOf('## [', unreleasedIndex + 1);

      if (nextHeaderIndex > -1) {
        const unreleasedSection = existingContent.substring(unreleasedIndex, nextHeaderIndex);
        content = unreleasedSection + '\n' + newEntry + '\n\n' + existingContent.substring(nextHeaderIndex);
      } else {
        content = existingContent + '\n\n' + newEntry;
      }
    } else {
      content = newEntry + '\n\n' + existingContent;
    }
  } else {
    content = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${newEntry}\n`;
  }

  fs.writeFileSync(changelogPath, content, 'utf8');
  return content;
}

function generateAndWriteChangelog(version, commits, options = {}) {
  const {
    changelogPath = path.join(process.cwd(), 'CHANGELOG.md'),
    includeHash = false,
    keepUnreleased = true,
    date = new Date().toISOString().split('T')[0],
  } = options;

  const existingContent = readExistingChangelog(changelogPath);
  const newEntry = generateChangelogEntry(version, date, commits, includeHash);
  return writeChangelog(changelogPath, newEntry, existingContent, keepUnreleased);
}

module.exports = {
  generateChangelogEntry,
  readExistingChangelog,
  writeChangelog,
  generateAndWriteChangelog,
  groupCommitsByType,
  formatCommitMessage,
};

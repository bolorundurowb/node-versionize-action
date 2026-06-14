const simpleGit = require('simple-git');

const CONVENTIONAL_COMMIT_REGEX = /^(feat|fix|chore|docs|style|refactor|perf|test|ci|build|revert)(\(.+\))?!?:/;
const BREAKING_CHANGE_REGEX = /^BREAKING CHANGE:/;
const BREAKING_FOOTER_REGEX = /^[A-Z][\w-]*: /;

async function getCommitsSinceLastTag() {
  const git = simpleGit();
  try {
    const lastTag = await git.raw('describe', '--tags', '--abbrev=0');
    const log = await git.log({ from: lastTag.trim(), to: 'HEAD' });
    return log.all;
  } catch {
    const log = await git.log();
    return log.all;
  }
}

function parseConventionalCommits(commits) {
  let hasBreakingChange = false;
  let hasFeature = false;
  let hasFix = false;
  const parsedCommits = [];

  for (const commit of commits) {
    const match = commit.message.match(CONVENTIONAL_COMMIT_REGEX);
    const isBreaking = BREAKING_CHANGE_REGEX.test(commit.message) ||
      commit.message.includes('!') ||
      commit.body && BREAKING_CHANGE_REGEX.test(commit.body);

    if (isBreaking) {
      hasBreakingChange = true;
    }

    if (match) {
      const type = match[1];
      const scope = match[2] ? match[2].slice(1, -1) : null;
      const isBreakingSuffix = commit.message.includes('!:');

      if (isBreakingSuffix) {
        hasBreakingChange = true;
      }

      if (type === 'feat') {
        hasFeature = true;
      } else if (type === 'fix') {
        hasFix = true;
      }

      parsedCommits.push({
        type,
        scope,
        breaking: isBreaking || isBreakingSuffix,
        message: commit.message,
        hash: commit.hash,
      });
    }
  }

  return {
    hasBreakingChange,
    hasFeature,
    hasFix,
    commits: parsedCommits,
  };
}

function determineBumpType(parsedResult, defaultBump = 'patch') {
  if (parsedResult.hasBreakingChange) {
    return 'major';
  }
  if (parsedResult.hasFeature) {
    return 'minor';
  }
  if (parsedResult.hasFix) {
    return 'patch';
  }
  return defaultBump;
}

async function detectBumpFromCommits(defaultBump = 'patch') {
  const commits = await getCommitsSinceLastTag();
  const parsed = parseConventionalCommits(commits);
  const bumpType = determineBumpType(parsed, defaultBump);
  return { bumpType, parsedCommits: parsed.commits, commitCount: commits.length };
}

module.exports = {
  getCommitsSinceLastTag,
  parseConventionalCommits,
  determineBumpType,
  detectBumpFromCommits,
};

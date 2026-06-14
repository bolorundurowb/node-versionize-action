# node-versionize-action

A powerful GitHub Action that automatically bumps your `package.json` version based on semantic versioning, conventional commits, and creates git tags. Perfect for single packages, monorepos, and npm/yarn workspaces.

## Features

- **Semantic Versioning**: Automatic version bumping (`major`, `minor`, `patch`)
- **Conventional Commits**: Auto-detect bump type from commit messages (`feat`, `fix`, `BREAKING CHANGE`)
- **Monorepo Support**: Handle multiple `package.json` files, npm/yarn workspaces, or explicit paths
- **Changelog Generation**: Auto-generate `CHANGELOG.md` from conventional commits
- **Pre/Post Release Hooks**: Run custom commands before or after release
- **Customizable Tags & Commits**: Configure tag prefixes, commit messages, and more

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `bump-type` | Version bump type: `major`, `minor`, `patch`, or `auto` (detects from commits) | No | `patch` |
| `traverse-dirs` | Search subdirectories for `package.json` files | No | `false` |
| `package-paths` | Comma-separated list of paths to `package.json` files or directories | No | Auto-detect |
| `use-workspaces` | Auto-detect and version all packages in npm/yarn workspaces | No | `false` |
| `generate-changelog` | Generate `CHANGELOG.md` from conventional commits | No | `false` |
| `changelog-include-hash` | Include commit hashes in generated changelog | No | `false` |
| `pre-release-hook` | Shell command to run before release (env: `VERSIONIZE_VERSION`) | No | - |
| `post-release-hook` | Shell command to run after release (env: `VERSIONIZE_VERSION`) | No | - |
| `tag-prefix` | Prefix for git tags | No | `v` |
| `commit-message-format` | Custom commit message format (`{version}`, `{tag}` placeholders) | No | `chore(release): {tag}` |
| `user-name` | Git commit author name | No | HEAD commit author |
| `user-email` | Git commit author email | No | HEAD commit author |
| `github-token` | GitHub token for pushing | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The new package version (e.g., `1.2.3`) |
| `tag` | The full tag name (e.g., `v1.2.3`) |
| `parsed-commits` | JSON array of parsed conventional commits (when using `auto` bump) |

## Quick Start

### Basic Usage

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: bolorundurowb/node-versionize-action@v2
        with:
          bump-type: minor
```

### Auto Bump from Conventional Commits

```yaml
- uses: bolorundurowb/node-versionize-action@v2
  with:
    bump-type: auto
    generate-changelog: true
```

This automatically:
- Parses commits since last tag
- `feat:` commits → minor bump
- `fix:` commits → patch bump
- `BREAKING CHANGE` or `!` → major bump

## Real-World Examples

### Monorepo with Workspaces

```yaml
- uses: bolorundurowb/node-versionize-action@v2
  with:
    bump-type: auto
    use-workspaces: true
    generate-changelog: true
```

For a `package.json` with:
```json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

### Explicit Package Paths

```yaml
- uses: bolorundurowb/node-versionize-action@v2
  with:
    bump-type: patch
    package-paths: |
      ./package.json,
      ./packages/core/package.json,
      ./packages/cli/package.json
```

### Full Release Workflow with Changelog

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: bolorundurowb/node-versionize-action@v2
        id: versionize
        with:
          bump-type: auto
          generate-changelog: true
          changelog-include-hash: true
          pre-release-hook: npm run test
          post-release-hook: echo "Released $VERSIONIZE_VERSION"

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ steps.versionize.outputs.tag }}
          body_path: CHANGELOG.md
```

### Custom Tag Prefix and Commit Message

```yaml
- uses: bolorundurowb/node-versionize-action@v2
  with:
    bump-type: minor
    tag-prefix: 'release/'
    commit-message-format: 'ci: bump version to {version}'
```

### Pre/Post Release Hooks

```yaml
- uses: bolorundurowb/node-versionize-action@v2
  with:
    bump-type: auto
    pre-release-hook: |
      npm ci && npm run build && npm test
    post-release-hook: |
      npm publish --access public
```

Available environment variables in hooks:
- `VERSIONIZE_VERSION` - The new version (e.g., `1.2.3`)
- `VERSIONIZE_HOOK` - The hook name (`pre-release` or `post-release`)

### Multiple Packages with Subdirectories

```yaml
- uses: bolorundurowb/node-versionize-action@v2
  with:
    bump-type: patch
    traverse-dirs: true
```

## Conventional Commits Format

The `auto` bump type parses commits using the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Supported Types

| Type | Bump |
|------|------|
| `feat` | minor |
| `fix` | patch |
| `BREAKING CHANGE` (footer) | major |
| `feat!` or `fix!` (with `!`) | major |

### Examples

```
feat: add user authentication
fix: resolve memory leak in parser
feat(api)!: redesign REST endpoints
fix(ui): correct button alignment

BREAKING CHANGE: minimum Node.js version is now 18
```

## Changelog Format

Generated changelogs follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2024-01-15

### Features

- **api:** add new webhook endpoint
- add user profile management

### Bug Fixes

- resolve race condition in auth flow (abc1234)
```

## Migration from v1

| v1 | v2 |
|----|----|
| `bump-type` required | `bump-type` optional (default: `patch`) |
| Only `major`, `minor`, `patch` | Added `auto` for conventional commits |
| `traverse-dirs` only | Added `use-workspaces` and `package-paths` |
| No changelog | Added `generate-changelog` |
| No hooks | Added `pre-release-hook` and `post-release-hook` |
| `node16` runtime | Updated to `node20` |

## License

MIT

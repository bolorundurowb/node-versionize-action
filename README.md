# node-versionize-action

This GitHub Action increments the version of the package lock json files in the repository, ommit the file changes and tags it as the latest version.

## Inputs

### `bump-type`

**required** Which part of the version should be incremented. The options are `major`, `minor` or `patch`. Default `patch`.

### `traverse-dirs`

**optional** Determine whether sub-drectories should be searched for `package.json` files. Default `false`.

## Outputs

### `version`

The updated version.


## Example usage

```yaml
- uses: actions/checkout@v2
- uses: actions/node-versionize-action@v1.0
  with:
    user-name: "version-bot"
    user-email: "sample@email.xyz"
    bump-type: 'minor'
    traverse-dirs: true
```

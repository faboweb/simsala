# simsala

Conflict free changelogs and simple release management

## Installation

```
npm i -g simsala
```

## Adding pending changes

```
simsala log
```

This will guide you through the process of adding pending changes as logs to the repository. Finally it will commit these changes to your branch to save you a step.

Options:

```
simsala log -h
Usage: log [options]

Options:
  -p, --pending-path [pending path]  Where are pending files located? (default: "./pending")
  -s, --stage-only                   Stage changes only instead of committing them
  -h, --help                         output usage information
```

## Releasing

```
simsala release
```

This will bump the version, merge the pending changes and add them to the `CHANGELOG.md`. Finally it will commit the version changes and tag the commit.

Options:

```
$ simsala release -h
Usage: release [options]

Options:
  -s, --semver [semver type]             Which version (patch|minor|mayor) your want to increase? (default: "patch")
  -p, --pending-path [pending path]      Where are pending files located? (default: "./pending")
  -c, --changelog-path [changelog path]  Where is the changelog located? (default: "./CHANGELOG.md")
  -b, --beta                             Is this a beta release?
  -s, --stage-only                       Stage version bump changes only instead of committing them
  -h, --help                             output usage information
```

## Release Candidate

In a colaborative flow you might want to create a PR for any release so your colleagues can approve the release. Simsala provides a command to create a release PR.

```
simsala release-candidate
```

Options:

```
$ simsala release-candidate -h
Usage: release-candidate [options]

Options:
  -s, --semver <semver type>             Which version (patch|minor|mayor) your want to increase? (default: "patch")
  -p, --pending-path <pending path>      Where are pending files located? (default: "./pending")
  -c, --changelog-path <changelog path>  Where is the changelog located? (default: "./CHANGELOG.md")
  -b, --beta                             Is this a beta release?
  -o, --owner <owner>                    Name of the owner or organization of the repository. (guessed from origin if empty)
  -r, --repository <repository>          Name of the repo. (guessed from origin if empty)
  -t, --token <github auth token>        Token to authenticate to GitHub (to push chages).
  -h, --help
```

## Develop

To start `simsala` in development run:

```
yarn start
```

## Test

To test `simsala` run:

```
yarn test
```

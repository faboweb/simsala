# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<!-- SIMSALA --> <!-- DON'T DELETE, used for automatic changelog updates -->

## [0.0.22] - 2020-06-11

### Added

- Added possibility to prefix releases @faboweb

## [0.0.21] - 2020-04-11

### Added

- Added example for GitHub Action for changelog check @faboweb

### Fixed

- Missing dependency @faboweb

## [0.0.20] - 2020-04-09

### Changed

- Change how release-candidate pushes to work with GitHub actions @faboweb @faboweb

## [0.0.19] - 2020-01-25

### Changed

- Release to develop first to avoid merge back @faboweb

## [0.0.18] - 2019-07-18

### Security

- Updated packages @faboweb

## [0.0.17] - 2019-07-18

### Fixed

- Fixed calculation of current branch for pending check @faboweb

## [0.0.16] - 2019-06-19

### Fixed

- The changelog check was not properly failing @faboweb

## [0.0.15] - 2019-06-07

### Fixed

- Properly push tags for release prs @faboweb

## [0.0.14] - 2019-06-04

### Fixed

- Fixed parsing new changelog type format including a space @faboweb

## [0.0.13] - 2019-05-23

### Fixed

- Fixed initialization of changelog due to wrong path @faboweb
- Fixed lineendings to fix Mac support @faboweb

## [0.0.12] - 2019-05-17

### Added

- TEST @faboweb

### Fixed

- Fixed prerelease versioning @faboweb

## [0.0.11] - 2019-05-17

### Fixed

- change node environment to fix circleci @faboweb

## [0.0.10] - 2019-05-17

### Fixed

- Revert node environment fix for circle @faboweb

## [0.0.9] - 2019-05-17

### Changed

- Only check for added changes not removed once @faboweb

### Fixed

- Removed node env tag to fix circleci @faboweb

## [0.0.8] - 2019-05-17

### Fixed

- Fixed pending check @faboweb

## [0.0.7] - 2019-05-16

### Added

- Added the possibility to add a leading message to release candidates @faboweb
- Added new categories for development changes @faboweb

## [0.0.6] - 2019-04-15

### Added

- Added simsala as CLI command @faboweb

## [0.0.5] - 2019-04-15

### Added

- Guessing repository from origin remote @faboweb

## [0.0.4] - 2019-04-15

### Fixed

- Fixed pending change missing detection @faboweb

## [0.0.3] - 2019-04-14

### Added

- Added check if pending got updated (for CI) @faboweb
- Added release candidate PR option @faboweb

### Changed

- Changed name to simsala @faboweb

### Fixed

- Fixed changes addition committing bug @faboweb
- Fixed tests @faboweb

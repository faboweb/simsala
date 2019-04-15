"use strict";

const {
  beautifyChanges,
  updateChangeLog,
  collectPending,
  addCategory,
  updatePackageJson
} = require(`../src/release`);

it(`updates CHANGELOG`, () => {
  const previous = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<!-- SIMSALA -->

## [0.6.1] - 2018-05-24
`;

  const pending = `### Added

- xxx @faboweb

### Changed

- yyy @fedekunze`;

  const newVersion = `0.6.2`;
  const now = new Date(`2018-05-25`);

  const updated = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<!-- SIMSALA -->

## [0.6.2] - 2018-05-25

### Added

- xxx @faboweb

### Changed

- yyy @fedekunze

## [0.6.1] - 2018-05-24
`;

  expect(updateChangeLog(previous, pending, newVersion, now)).toEqual(updated);
});

it(`updates package.json`, () => {
  const previous = {
    name: `cosmos-voyager`,
    productName: `Cosmos Voyager`,
    version: `0.6.1`
  };

  const newVersion = `0.6.2`;

  const updated = {
    name: `cosmos-voyager`,
    productName: `Cosmos Voyager`,
    version: `0.6.2`
  };

  expect(updatePackageJson(previous, newVersion)).toEqual(updated);
});

it(`beautifys changes`, () => {
  const pending = [
    `[Added] xxx @faboweb\n[Changed] yyy @fedekunze`,
    `[Fixed] zzz @faboweb`
  ];
  const expected = `### Added

- xxx @faboweb

### Changed

- yyy @fedekunze

### Fixed

- zzz @faboweb`;
  expect(beautifyChanges(pending)).toBe(expected);
});

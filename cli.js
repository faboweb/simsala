#!/usr/bin/env node

var program = require("commander");
const { release } = require("./merge-pending");
const { logChanges } = require("./add-pending");

program
  .command("release")
  .option(
    "-s, --semver [semver type]",
    "Which version (patch|minor|mayor) your want to increase?",
    /^(patch|minor|mayor)$/i,
    "patch"
  )
  .option(
    "-p, --pending-path [pending path]",
    "Where are pending files located?",
    "./pending"
  )
  .option(
    "-c, --changelog-path [changelog path]",
    "Where is the changelog located?",
    "./CHANGELOG.md"
  )
  .option("-b, --beta", "Is this a beta release?", false)
  .action(async function(options) {
    const changesFound = await release(
      options.semver,
      options.beta,
      options.pendingPath,
      options.changelogPath
    );
    if (!changesFound) {
      console.log(
        `No pending changes where found at ${
          options.pendingPath
        }. Not proceeding with release.`
      );
      return;
    }
  });

program
  .command("log")
  .option(
    "-p, --pending-path [pending path]",
    "Where are pending files located?",
    "./pending"
  )
  .option("-c, --commit", "Commit pending changes", true)
  .action(async function(options) {
    logChanges(options.pendingPath, options.commit);
  });

program.parse(process.argv);

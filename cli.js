#!/usr/bin/env node

var program = require("commander");
const { release } = require("./merge-pending");
const { logChanges } = require("./add-pending");
const { checkPendingAdded } = require("./pending-added-check");

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
  .option(
    "-s, --stage-only",
    "Stage version bump changes only instead of committing them"
  )
  .action(async function(options) {
    const changesFound = await release(
      options.semver,
      options.beta,
      options.pendingPath,
      options.changelogPath,
      !options.stageOnly
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
  .option("-s, --stage-only", "Stage changes only instead of committing them")
  .action(async function(options) {
    logChanges(options.pendingPath, !options.stageOnly);
  });

program
  .command("check")
  .option(
    "-p, --pending-path [pending path]",
    "Where are pending files located?",
    "./pending"
  )
  .option(
    "-r, --root-branch [root branch]",
    "Against which branch do you merge (too compare changes against)?",
    "origin/develop"
  )
  .option(
    "-s, --skip-branches [skipped branches separted by ',']",
    "Which branches should not be checked?",
    "develop,master"
  )
  .action(async function(options) {
    checkPendingAdded(
      options.pendingPath,
      options.rootBranch,
      options.skipBranches
    );
  });

// default to output help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);

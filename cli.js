#!/usr/bin/env node

var program = require("commander");
const { release, incrementVersion } = require("./release");
const { createReleaseCandidate } = require("./release-candidate");
const { logChanges } = require("./add-pending");
const { checkPendingAdded } = require("./pending-added-check");

function getNewVersion() {
  const packageJsonPath = join(process.cwd(), `package.json`);
  const packageJson = require(packageJsonPath);
  const oldVersion = packageJson.version;

  // calculate new data
  const newVersion = incrementVersion(
    oldVersion,
    versionIncrementType,
    isBetaRelease
  );
  console.log(`New version:`, newVersion);

  return newVersion;
}

const releaseCommonOptions = command =>
  command
    .option(
      "-s, --semver <semver type>",
      "Which version (patch|minor|mayor) your want to increase?",
      /^(patch|minor|mayor)$/i,
      "patch"
    )
    .option(
      "-p, --pending-path <pending path>",
      "Where are pending files located?",
      "./pending"
    )
    .option(
      "-c, --changelog-path <changelog path>",
      "Where is the changelog located?",
      "./CHANGELOG.md"
    )
    .option("-b, --beta", "Is this a beta release?", false);

releaseCommonOptions(program.command("release"))
  .option(
    "-s, --stage-only",
    "Stage version bump changes only instead of committing them"
  )
  .action(async function(options) {
    const newVersion = getNewVersion(options.semver, options.beta);
    const { changes } = await release(
      newVersion,
      options.pendingPath,
      options.changelogPath,
      !options.stageOnly
    );

    if (!changes) {
      console.log(
        `No pending changes where found at ${
          options.pendingPath
        }. Not proceeding with release.`
      );
      return;
    }
  });

releaseCommonOptions(program.command("release-candidate"))
  .option("-r, --repository <repository>", "Name of the repo.")
  .option(
    "-o, --owner <owner>",
    "Name of the owner or organization of the repository."
  )
  .option(
    "-t, --token <github auth token>",
    "Token to authenticate to GitHub (to push chages)."
  )
  .action(async function(options) {
    const newVersion = getNewVersion(options.semver, options.beta);
    const { changes } = createReleaseCandidate(
      newVersion,
      options.pendingPath,
      options.changelogPath,
      options.token,
      options.owner,
      options.repository
    );

    if (!changes) {
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

module.exports = {
  logChanges,
  release,
  checkPendingAdded,
  incrementVersion
};

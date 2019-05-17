#!/usr/bin/env node

const program = require("commander");
const { release } = require("./release");
const { createReleaseCandidate } = require("./release-candidate");
const { logChanges } = require("./add-pending");
const { checkPendingAdded } = require("./pending-added-check");
const { getNewVersion } = require("./version");

function noChanges(pendingPath) {
  console.log(
    `No pending changes where found at ${pendingPath}. Not proceeding with release.`
  );
}

const releaseCommonOptions = command =>
  command
    .option(
      "-s, --semver <semver type>",
      "Which version (patch|minor|mayor|prerelease) your want to increase?",
      /^(patch|minor|mayor|prerelease)$/i,
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
    );

releaseCommonOptions(program.command("release"))
  .option(
    "-s, --stage-only",
    "Stage version bump changes only instead of committing them"
  )
  .action(async function(options) {
    const newVersion = getNewVersion(options.semver);
    const { changes } = await release(
      newVersion,
      options.pendingPath,
      options.changelogPath,
      !options.stageOnly
    ).catch(err => {
      console.error(err.message);
      return;
    });

    if (!changes) {
      noChanges(options.pendingPath);
    }
  });

releaseCommonOptions(program.command("release-candidate"))
  .option(
    "-o, --owner <owner>",
    "Name of the owner or organization of the repository. (guessed from origin if empty)"
  )
  .option(
    "-r, --repository <repository>",
    "Name of the repo. (guessed from origin if empty)"
  )
  .option(
    "-t, --token <github auth token>",
    "Token to authenticate to GitHub (to push chages)."
  )
  .option(
    "-m, --message <message>",
    "Message to prepend to the changes in the release PR description."
  )
  .action(async function(options) {
    const token = options.token || process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      console.error(
        "To create a release candidate PR, you need to provide a GitHub access token via '--token' or by setting the environment variable GITHUB_ACCESS_TOKEN."
      );
      return;
    }
    const newVersion = getNewVersion(options.semver, options.beta);
    const { changes } = await createReleaseCandidate(
      newVersion,
      options.pendingPath,
      options.changelogPath,
      options.token,
      options.owner,
      options.repository,
      options.message
    ).catch(err => {
      console.error(err.message);
      return;
    });

    if (!changes) {
      noChanges(options.pendingPath);
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
    logChanges(options.pendingPath, !options.stageOnly).catch(err =>
      console.error(err.message)
    );
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
    ).catch(err => console.error(err.message));
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
  getNewVersion
};

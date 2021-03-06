const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);

async function checkPendingAdded(
  pendingChangesPath,
  rootBranch,
  skippedBranches
) {
  const currentBranch = (await exec(
    "git rev-parse --abbrev-ref HEAD"
  )).stdout.trim();

  if (skippedBranches.split(",").indexOf(currentBranch) !== -1) {
    console.log(
      "This branch is a skipped branch. Checks on updating the PENDING log are omitted."
    );
    return true;
  }

  const changedFiles = (await exec(
    `git diff --name-only --diff-filter=A ${rootBranch}`
  )).stdout;
  const changedFilesInPending = changedFiles
    .split("\n")
    .filter(file => ("./" + file).startsWith(pendingChangesPath));

  if (changedFilesInPending.length >= 1) {
    console.log("Changes added.");
    return true;
  }

  throw new Error(
    `!! There were no changes found at ${pendingChangesPath}. Please run \`simsala log\` !!`
  );
}

module.exports = {
  checkPendingAdded
};

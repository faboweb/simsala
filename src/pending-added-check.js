const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);

async function checkPendingAdded(
  pendingChangesPath,
  rootBranch,
  skippedBranches
) {
  const currentBranch = await exec("git rev-parse --abbrev-ref HEAD");

  if (skippedBranches.indexOf(currentBranch) !== -1) {
    console.log(
      "This branch is a skipped branch. Checks on updating the PENDING log are omitted."
    );
    return true;
  }

  const changedFiles = (await exec(`git diff --name-only ${rootBranch}`))
    .stdout;
  const changedFilesInPending = changedFiles
    .split("\n")
    .filter(file => ("./" + file).startsWith(pendingChangesPath));

  if (changedFilesInPending.length >= 1) {
    console.log("Changes added.");
    return true;
  }

  throw new Error("!! Changes not added. Please run `simsala log` !!");
}

module.exports = {
  checkPendingAdded
};
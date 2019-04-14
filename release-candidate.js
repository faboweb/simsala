"use strict";

const octokit = require(`@octokit/rest`)();
const { release } = require(`./release`);
const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);

const createPullRequest = async (
  octokit,
  { changes, tag, head, owner, repo }
) => {
  await octokit.pullRequests.create({
    owner,
    repo,
    title: `[Simsala] automatic release created for ${tag}`,
    head,
    base: `master`,
    body: changes,
    maintainer_can_modify: true
  });
};

async function createReleaseCandidate(
  newVersion,
  pendingChangesPath,
  changelogPath,
  token,
  owner,
  repo
) {
  const tag = `v${newVersion}`;
  const branch = `release-candidate/${tag}`;

  if (token) {
    octokit.authenticate({
      type: `token`,
      token
    });
  }

  await exec(`git checkout -B ${branch}`);

  const { changes } = await release(
    newVersion,
    pendingChangesPath,
    changelogPath,
    false
  );

  await createPullRequest(octokit, {
    changes,
    token,
    tag,
    head: branch,
    owner,
    repo
  });
}

module.exports = {
  createReleaseCandidate
};

"use strict";

const Octokit = require(`@octokit/rest`);
const { release } = require(`./release`);
const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);

async function createPullRequest(octokit, { changes, tag, head, owner, repo }) {
  await octokit.pullRequests.create({
    owner,
    repo,
    title: `[Simsala] automatic release created for ${tag}`,
    head,
    base: `master`,
    body: changes,
    maintainer_can_modify: true
  });
}

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

  const authenticatedClient = new Octokit({
    auth: `token ${token}`
  });

  const currentBranch = (await exec(
    `git rev-parse --abbrev-ref HEAD`
  )).stdout.trim();

  await exec(`git checkout -B ${branch}`);

  try {
    const { changes } = await release(
      newVersion,
      pendingChangesPath,
      changelogPath,
      false
    );

    if (changes === null) {
      return { changes: null };
    }

    await createPullRequest(authenticatedClient, {
      changes,
      token,
      tag,
      head: branch,
      owner,
      repo
    });
  } finally {
    // return to the old branch
    await exec(`git checkout ${currentBranch}`);
  }
}

module.exports = {
  createReleaseCandidate
};

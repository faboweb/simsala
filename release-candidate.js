const { release } = require(`./release`);
const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);
const axios = require("axios");

async function createPullRequest({ changes, tag, head, owner, repo, token }) {
  axios.defaults.headers.common["Authorization"] = `token ${token}`;
  await axios
    .post(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      title: `[Simsala] automatic release created for ${tag}`,
      head,
      base: `master`,
      body: changes,
      maintainer_can_modify: true
    })
    .catch(err => {
      console.error(err);
      throw err;
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

    await createPullRequest({
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

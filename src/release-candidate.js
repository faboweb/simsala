const { release } = require(`./release`);
const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);
const axios = require("axios");

async function createPullRequest({
  textContent,
  tag,
  head,
  owner,
  repo,
  token
}) {
  axios.defaults.headers.common["Authorization"] = `token ${token}`;
  await axios
    .post(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      title: `[Simsala] automatic release created for ${tag}`,
      head,
      base: `master`,
      body: textContent,
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
  repo,
  message
) {
  const tag = `v${newVersion}`;
  const branch = `release-candidate/${tag}`;

  if (!owner || !repo) {
    console.log("Guessing GitHub repository from remote 'origin'.");
    const origin = (await exec("git remote get-url origin")).stdout.trim();
    const match = /https:\/\/github\.com\/(.+)\/(.+)\.git/.exec(origin);
    if (match.length === 0) {
      console.error("Git remote 'origin' is not a GitHub repository");
      return { changes: null };
    }
    owner = match[1];
    repo = match[2];
  }

  const currentBranch = (await exec(
    `git rev-parse --abbrev-ref HEAD`
  )).stdout.trim();

  await exec(`git checkout -B ${branch}`);

  let changes;
  try {
    const releaseInfos = await release(
      newVersion,
      pendingChangesPath,
      changelogPath,
      true
    );
    changes = releaseInfos.changes;

    if (changes === null) {
      return { changes: null };
    }

    // the final PR content will have the prepended message from the CLI and the stiched changes
    const textContent = `${message ? `${message}\n\n` : ``}${changes}`;

    console.log("Pushing changes");
    await exec(`git push --set-upstream origin ${branch}`);

    console.log("Creating PR");
    await createPullRequest({
      textContent,
      token,
      tag,
      head: branch,
      owner,
      repo
    });
  } finally {
    // return to the old branch
    await exec(`git checkout -f ${currentBranch}`);
  }

  return {
    version: newVersion,
    changes
  };
}

module.exports = {
  createReleaseCandidate
};

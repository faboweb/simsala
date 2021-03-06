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
  token,
  baseBranch
}) {
  axios.defaults.headers.common["Authorization"] = `token ${token}`;
  await axios
    .post(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      title: `[Simsala] automatic release created for ${tag}`,
      head,
      base: baseBranch,
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
  message,
  baseBranch,
  tagPrefix
) {
  const tag = `${tagPrefix ? tagPrefix + "-" : ""}v${newVersion}`;
  console.log(tag);
  const branch = `release-candidate/${tag}`;

  if (!owner || !repo) {
    if (process.env.GITHUB_REPOSITORY) {
      console.log(
        "Guessing GitHub repository from remote environment variable."
      );
      owner = process.env.GITHUB_REPOSITORY.split("/")[0];
      repo = process.env.GITHUB_REPOSITORY.split("/")[1];
    } else {
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

    const remote_repo = `https://simsala_bot:${token}@github.com/${owner}/${repo}.git`;
    const pushCommand = `git push "${remote_repo}" HEAD:${branch} --set-upstream --follow-tags --force --tags`;
    console.log("Pushing changes", pushCommand);
    await exec(
      `git push "${remote_repo}" HEAD:${branch} --set-upstream --follow-tags --force --tags`
    );

    console.log("Creating PR");
    await createPullRequest({
      textContent,
      token,
      tag,
      head: branch,
      owner,
      repo,
      baseBranch
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

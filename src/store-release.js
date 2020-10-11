const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);
const axios = require("axios");
const fs = require("fs");

async function uploadRelease({ tag, textContent, owner, repo, token }) {
  axios.defaults.headers.common["Authorization"] = `token ${token}`;
  await axios
    .post(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      name: `Release ${tag}`,
      body: textContent,
      tag_name: tag
    })
    .catch(err => {
      console.error(err);
      throw err;
    });
}

async function storeRelease(tag, tagPrefix, changelogPath, token, owner, repo) {
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

  const changeLog = fs.readFileSync(changelogPath, `utf8`);
  let version = tagPrefix ? tag.replace(tagPrefix + "-", "") : tag;
  version = tag.replace("v", "");

  // match from version tag until next version tag or end of file
  // 1st group version title "## [0.0.22] - 2020-06-11"
  // 2nd group content
  // 3rd group next version title or end of file

  // console.log(`(## \\[${version.replace(/\./g,`\\.`)}\] - \\S+\\n)([\\s\\S]+)(## \\[|\\z)`)
  // return
  const versions = changeLog.split("## ["); // header tag for versions
  const versionSection = versions.find(record => record.startsWith(version));
  if (!versionSection)
    throw new Error(`No changelog entry found for version ${version}`);
  const versionSectionBody = versionSection
    .substr(versionSection.indexOf("\n"))
    .trim();

  console.log("Creating Release");
  await uploadRelease({
    textContent: versionSectionBody,
    token,
    tag,
    owner,
    repo
  });
}

module.exports = {
  storeRelease
};

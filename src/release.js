const { join, resolve } = require("path");
const fs = require("fs");
const groupBy = require("lodash/groupBy");
const { promisify } = require(`util`);
const exec = promisify(require(`child_process`).exec);

// collect all changes from files
/* istanbul ignore next */
async function collectPending(changesPath) {
  if (fs.readdirSync(changesPath).length === 0) {
    return [];
  }
  const files = await fs.readdirSync(changesPath);
  const allChanges = files.map(file => {
    return fs.readFileSync(join(changesPath, file), `utf8`);
  });

  return allChanges;
}

// output lines in a beautified way having a header and content with bullet points
function addCategory(output, category, groupedLines) {
  if (groupedLines[category]) {
    output += `### ${category}\n\n`;
    groupedLines[category].forEach(
      ({ content }) => (output += `- ${content}\n`)
    );
    output += `\n`;
  }

  return output;
}

// stitch all changes into one nice changelog
// changes is an array of the content from all individual changelogs
function beautifyChanges(changes) {
  const lines = changes
    .join(`\n`)
    .split(`\n`)
    // defensive cleanup
    .map(line => line.trim())
    .filter(line => line !== "");

  const categorized = lines.map(line => {
    const matches = /\[(\w+)\] (.+)/.exec(line);
    return {
      type: matches[1],
      content: matches[2]
    };
  });
  const grouped = groupBy(categorized, `type`);

  let output = ``;
  output = addCategory(output, `Added`, grouped);
  output = addCategory(output, `Changed`, grouped);
  output = addCategory(output, `Fixed`, grouped);
  output = addCategory(output, `Security`, grouped);
  output = addCategory(output, `Deprecated`, grouped);
  output = addCategory(output, `Code Improvements`, grouped);
  output = addCategory(output, `Repository`, grouped);

  return output.trim();
}

function updateChangeLog(changeLog, pending, newVersion, now) {
  const today = now.toISOString().slice(0, 10);

  const lines = changeLog.split("\n");
  const anchorIndex = lines.findIndex(line =>
    line.startsWith("<!-- SIMSALA -->")
  );
  if (anchorIndex === -1) {
    throw new Error(
      "CHANGELOG.md was edited and is missing '<!-- SIMSALA -->' which is needed to calculate the top of the changelog."
    );
  }

  lines.splice(
    anchorIndex + 1,
    0,
    "", // resolves to a linebreak
    // insert a sub header with version and date
    `## [${newVersion}] - ${today}\n`,
    // insert the pending changes
    ...pending.split("\n")
  );

  return lines.join("\n");
}

const updatePackageJson = (packageJson, version) =>
  Object.assign({}, packageJson, { version });

async function release(newVersion, pendingChangesPath, changelogPath, commit) {
  const packageJsonPath = join(process.cwd(), `package.json`);
  const packageJson = require(packageJsonPath);

  changelogPath = resolve(changelogPath);
  if (!fs.existsSync(changelogPath)) {
    console.log("No CHANGELOG.md was found. Creating it.");
    fs.writeFileSync(
      changelogPath,
      fs.readFileSync(join(__dirname, `CHANGELOG.template.md`), `utf8`),
      "utf8"
    );
  }

  const changeLog = fs.readFileSync(changelogPath, `utf8`);
  const pending = await collectPending(pendingChangesPath);
  if (pending.length === 0) return { changes: null };
  const beautifiedPending = beautifyChanges(pending);

  const newChangeLog = updateChangeLog(
    changeLog,
    beautifiedPending,
    newVersion,
    new Date()
  );
  const newPackageJson = updatePackageJson(packageJson, newVersion);

  // write updates
  console.log(`Updating ${changelogPath}`);
  fs.writeFileSync(changelogPath, newChangeLog, `utf8`);
  console.log("Updating package.json");
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(newPackageJson, null, 2) + `\n`,
    `utf8`
  );

  // cleanup
  console.log("Removing old pending changes");
  const files = await fs.readdirSync(pendingChangesPath);
  files.forEach(file => {
    fs.unlinkSync(join(pendingChangesPath, file));
  });

  if (commit) {
    console.log("Committing changes");

    const tag = `v${newVersion}`;

    // commit version bump
    await exec(
      `git add ${pendingChangesPath} ${changelogPath} ${packageJsonPath}`
    );
    await exec(
      `git commit -m release-${newVersion} ${resolve(
        pendingChangesPath
      )} ${resolve(changelogPath)} ${resolve(packageJsonPath)}`
    );
    try {
      await exec(`git tag ${tag}`);
    } catch (err) {
      console.error("Couldn't add tag", err);
    }
  }

  return {
    version: newVersion,
    changes: beautifiedPending
  };
}

module.exports = {
  updateChangeLog,
  beautifyChanges,
  addCategory,
  collectPending,
  release,
  updatePackageJson
};

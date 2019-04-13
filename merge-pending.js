const { join, resolve } = require("path");
const fs = require("fs");
const semver = require("semver"); // only touches filesystem
const groupBy = require("lodash/groupBy"); // only touches filesystem

// collect all changes from files
/* istanbul ignore next */ async function collectPending(changesPath) {
  if (!fs.existsSync(changesPath)) {
    return "";
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
  const lines = changes.join(`\n`).split(`\n`);

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

  return output.trim();
}

function updateChangeLog(changeLog, pending, newVersion, now) {
  const today = now.toISOString().slice(0, 10);

  const lines = changeLog.split("\n");
  const anchorIndex = lines.findIndex(line =>
    line.startsWith("<!-- SAMSARA -->")
  );
  if (anchorIndex === -1) {
    throw new Error(
      "CHANGELOG.md was edited and is missing '<!-- SAMSARA --' which is needed to calculate the top of the changelog."
    );
  }

  const insertedLines = lines
    // insert the pending changes
    .splice(anchorIndex, 0, pending.split("\n"))
    // insert a sub header with version and date
    .splice(anchorIndex, 0, `## [${newVersion}] - ${today}\n\n`);

  return insertedLines.join("\n");
}

const updatePackageJson = (packageJson, version) =>
  Object.assign({}, packageJson, { version })

async function release(
  versionIncrementType,
  isBetaRelease,
  pendingChangesPath,
  changelogPath
) {
  // read data
  const packageJson = require(join(process.cwd(), `package.json`));

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
  if (!pending) return false;
  const beautifiedPending = beautifyChanges(pending);

  const oldVersion = packageJson.version;

  // calculate new data
  const newVersion = semver.inc(
    oldVersion,
    versionIncrementType,
    isBetaRelease ? "beta" : undefined
  );
  console.log(`New version:`, newVersion);

  const newChangeLog = updateChangeLog(
    changeLog,
    beautifiedPending,
    newVersion,
    new Date()
  );
  const newPackageJson = updatePackageJson(packageJson, newVersion);

  // write updates
  console.log("Updating CHANGELOG.md");
  fs.writeFileSync(join(process.cwd(), `CHANGELOG.md`), newChangeLog, `utf8`);
  console.log("Updating package.json");
  fs.writeFileSync(
    join(process.cwd(), `package.json`),
    JSON.stringify(newPackageJson, null, 2) + `\n`,
    `utf8`
  );

  // cleanup
  console.log("Removing old pending changes");
  const files = await fs.readdirSync(pendingChangesPath);
  files.forEach(file => {
    fs.unlinkSync(join(pendingChangesPath, file));
  });

  return true;
}

module.exports = {
  updateChangeLog,
  beautifyChanges,
  addCategory,
  collectPending,
  release
};

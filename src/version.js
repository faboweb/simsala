const { join } = require("path");
const semver = require("semver");

function incrementVersion(
  oldVersion,
  versionIncrementType = "patch",
  isBetaRelease = false
) {
  return semver.inc(
    oldVersion,
    versionIncrementType,
    isBetaRelease ? "beta" : undefined
  );
}

function getNewVersion(versionIncrementType, isBetaRelease) {
  const packageJsonPath = join(process.cwd(), `package.json`);
  const packageJson = require(packageJsonPath);
  const oldVersion = packageJson.version;

  // calculate new data
  const newVersion = incrementVersion(
    oldVersion,
    versionIncrementType,
    isBetaRelease
  );
  console.log(`New version:`, newVersion);

  return newVersion;
}

module.exports = {
  getNewVersion
};

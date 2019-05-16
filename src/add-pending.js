const fs = require(`fs`);
const { promisify } = require(`util`);
const { join, resolve } = require(`path`);
const exec = promisify(require(`child_process`).exec);
const inquirer = require(`inquirer`);

const changes = [];

// main function to inquire about the pending changes
const ask = async () => {
  const answers = await inquirer.prompt([
    {
      type: `list`,
      name: `type`,
      message: `What type of change do you want to add to the changelog?`,
      choices: [
        {
          name: `Addition of feature`,
          value: `Added`
        },
        {
          name: `Change of existing behavior`,
          value: `Changed`
        },
        {
          name: `Fix for a bug`,
          value: `Fixed`
        },
        {
          name: `Security improvement`,
          value: `Security`
        },
        {
          name: `Deprecation of unused code/feature`,
          value: `Deprecated`
        },
        {
          name: `Refactoring or code deprecation`,
          value: `Code Improvements`
        },
        {
          name: `Addition of coding tools, repository restructuring, et al`,
          value: `Repository`
        }
      ]
    },
    {
      type: `input`,
      name: `content`,
      message: `What is the content of the change?`,
      validate: function(value) {
        if (value) return true;

        return `You need to specify the change.`;
      }
    },
    {
      type: `list`,
      name: `referenceType`,
      message: `(mandatory) Which GitHub reference has this?`,
      choices: [
        {
          name: `Issue`,
          value: `issues`
        },
        {
          name: `Pull Request`,
          value: `pull`
        },
        {
          name: `(Avoid) None`,
          value: `none`
        }
      ]
    }
  ]);
  if (answers.referenceType !== "none") {
    Object.assign(
      answers,
      await inquirer.prompt({
        type: `input`,
        name: `referenceId`,
        message: `What is the id of the reference issue/PR on GitHub?`,
        validate: function(value) {
          if (value) return true;

          return `You need to specify the GitHub reference.`;
        },
        transformer(input) {
          return input.replace(`#`, ``);
        }
      })
    );
  }
  Object.assign(
    answers,
    await inquirer.prompt([
      {
        type: `input`,
        name: `author`,
        message: `What is your GitHub handle?`,
        validate: function(value) {
          if (value) return true;

          return `You need to specify your GitHub handle.`;
        }
      },
      {
        type: `confirm`,
        name: `anotherChange`,
        message: `Want to enter another change?`,
        default: false
      }
    ])
  );

  changes.push(answers);
  if (answers.anotherChange) {
    await ask();
  }
};

async function logChanges(pendingChangesPath, commit) {
  // use branch name to avoid conflicts on changes entries
  let branch = "";
  try {
    branch = (await exec(`git rev-parse --abbrev-ref HEAD`)).stdout
      .trim()
      .replace(/\//g, `_`);
  } catch (err) {
    console.error(
      "Couldn't get the branch name. Is this a .git repository (required)?"
    );
    return;
  }
  const changesFolderPath = resolve(pendingChangesPath);
  if (!fs.existsSync(changesFolderPath)) {
    fs.mkdirSync(changesFolderPath);
  }
  const changeFileName = join(changesFolderPath, branch);

  // handle existing pending changes file
  if (fs.existsSync(changeFileName)) {
    const answers = await inquirer.prompt({
      type: `list`,
      name: `keep`,
      message: `Existing pending changes where found for your branch. How do you want to proceed?`,
      choices: [
        {
          name: `Append changes`,
          value: `append`
        },
        {
          name: `Delete old change`,
          value: `drop`
        }
      ]
    });
    if (answers.keep === "drop") {
      fs.unlinkSync(changeFileName);
    }
  }

  // inquire about changes to log
  await ask();

  // build changes string
  const changelog = changes.reduce(
    (changelog, { type, content, author, referenceType, referenceId }) => {
      const referenceLink =
        referenceType === "none"
          ? ""
          : // eslint-disable-next-line no-useless-escape
            `[\#${referenceId}](https://github.com/cosmos/lunie/${referenceType}/${referenceId}) `;
      changelog += `[${type}] ${referenceLink}${content} @${author}\n`;
      return changelog;
    },
    ``
  );

  // write changes to file
  if (fs.existsSync(changeFileName)) {
    fs.appendFileSync(changeFileName, "\n" + changelog.trim(), "utf8");
  } else {
    fs.writeFileSync(changeFileName, changelog.trim(), "utf8");
  }

  if (commit) {
    // commit changelog
    await exec(`git add ${changeFileName}`);
    await exec(`git commit -m changelog ${resolve(changeFileName)}`);
  }
}

module.exports = {
  logChanges
};

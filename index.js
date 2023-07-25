const github = JSON.parse(process.env.GITHUB);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const getFieldValue = (text, start, end) => {
  return text
    .match(
      new RegExp(
        `^${escapeRegExp(start)}\\s\([\\s\\S]*\)${
          end ? escapeRegExp(end) : ".*"
        }$`,
        "m"
      )
    )[1]
    .replace(/^<!---.*-->$/gm, "");
};

const JIRA_ISSUE_TYPE = Object.freeze([
  {
    type: "bug",
    validate: (ev) =>
      ev.issue && ev.issue.labels.some((l) => l.name === "🐞 bug"),
    body(ev) {
      const getValue = (start, end) =>
        getFieldValue(ev.body, `### ${start}`, end ? `### ${end}` : "");

      return {
        fields: {
          summary: ev.title,
          description: getValue("Describe the Bug", "To Reproduce"),
          toReproduce: getValue("To Reproduce", "Expected Behavior"),
          expectedBehavior: getValue("Expected Behavior", "Possible Fix"),
          possibleFix: getValue(
            "Possible Fix",
            "Provide environment information"
          ),
          environmentInformation: getValue("Provide environment information"),
          link: ev.html_url,
          type: this.type,
        },
      };
    },
  },
  {
    type: "PR",
    validate: (ev) => !!ev.pull_request,
    body(ev) {
      const getValue = (start, end) =>
        getFieldValue(ev.body, `## ${start}`, end ? `## ${end}` : "");

      return {
        fields: {
          summary: ev.title,
          description: getValue("Description / Motivation", "Testing Details"),
          testingDetails: getValue("Testing Details", "Types of changes"),
          changeType: getValue("Types of changes"),
          link: ev.html_url,
          type: this.type,
        },
      };
    },
  },
  {
    type: "doc",
    validate: (ev) =>
      ev.issue && ev.issue.labels.some((l) => l.name === "📑 doc"),
    body(ev) {
      const getValue = (start, end) =>
        getFieldValue(ev.body, `### ${start}`, end ? `### ${end}` : "");

      return {
        fields: {
          summary: ev.title,
          description: getValue(
            "What is the improvement or update you wish to see?",
            "Is there any context that might help us understand?"
          ),
          context: getValue(
            "Is there any context that might help us understand?",
            "Does the docs page already exist? Please link to it."
          ),
          docLink: getValue(
            "Does the docs page already exist? Please link to it."
          ),
          link: ev.html_url,
          type: this.type,
        },
      };
    },
  },
]);

(async () => {
  const jiraIssueType = JIRA_ISSUE_TYPE.find((o) => o.validate(github.event));
  const event = github.event.issue || github.event.pull_request;

  let userInfoRes;
  try {
    userInfoRes = await fetch(
      `https://api.github.com/repos/${github.event.repository.owner.login}/${github.event.repository.name}/collaborators/${event.user.login}/permission`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
        },
      }
    );

    userInfoRes = await userInfoRes.json();
  } catch (error) {
    console.log("Error occurred while fetching collabor information", error);
    process.exit(1);
  }

  // don't create Jira issue if PR is created by admin
  if (github.event.pull_request && userInfoRes.permission === "admin") {
    console.log(
      "Skipped Jira issue creation, since the Pull Request was created by admin"
    );
    return;
  }

  try {
    await fetch(process.env.JIRA_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify(jiraIssueType.body(event)),
    });
  } catch (error) {
    console.log("Error occurred while creating Jira issue", error);
    process.exit(1);
  }
})();

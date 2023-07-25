const github = JSON.parse(process.env.GITHUB);

const JIRA_ISSUE_TYPE = Object.freeze([
  {
    type: "bug",
    validate: (ev) =>
      ev.issue && ev.issue.labels.some((l) => l.name === "🐞 bug"),
    body(ev) {
      return {
        fields: {
          summary: ev.title,
          description: ev.body,
          link: ev.html_url,
          type: this.type,
        },
      };
    },
  },
  {
    type: "task",
    validate: (ev) => !!ev.pull_request,
    body(ev) {
      return {
        fields: {
          summary: ev.title,
          description: ev.body,
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
      return {
        fields: {
          summary: ev.title,
          description: ev.body,
          link: ev.html_url,
          type: this.type,
        },
      };
    },
  },
]);

(async () => {
  const jiraIssueType = JIRA_ISSUE_TYPE.find((o) =>
    o.validate(github.event)
  );
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

  console.log(event.body);

  // don't create Jira issue if PR is created by admin
  // if (github.event.pull_request && userInfoRes.permission === 'admin') return;

  try {
    // await fetch(process.env.JIRA_WEBHOOK_URL, {
    //   method: "POST",
    //   body: JSON.stringify(jiraIssueType.body(event)),
    // });
  } catch (error) {
    console.log("Error occurred while creating Jira issue", error);
    process.exit(1);
  }
})();
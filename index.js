const github = JSON.parse(process.env.GITHUB);

const JIRA_ISSUE_TYPE = Object.freeze([
  {
    type: "bug",
    validate: (ev) => ev.issue && ev.issue.labels.some(l => l.name === "🐞 bug"),
  },
  {
    type: "task",
    validate: (ev) => !!ev.pull_request,
  },
  {
    type: "doc",
    validate: (ev) => ev.issue && ev.issue.labels.some(l => l.name === "📑 doc"),
  },
]);

(async () => {
  const jiraIssueType = JIRA_ISSUE_TYPE.find((o) =>
    o.validate(github.event)
  ).type;
  const event = github.event.issue || github.event.pull_request;

  let userInfoRes;
  try {
    userInfoRes = await fetch(
      `https://api.github.com/repos/${github.event.repository.owner.login}/${github.event.repository.name}/collaborators/${event.user.login}`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
        },
      }
    );
  } catch (error) {
    console.log("Error occurred while fetching collabor information", error);
    process.exit(1);
  }

  // const isUserCollaborator = userInfoRes.status === 204;

  // don't create Jira issue if PR is created by collaborator
  // if (github.event.pull_request && isUserCollaborator) return;

  try {
    await fetch(process.env.JIRA_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({
        fields: {
          summary: event.title,
          description: event.body.join(''),
          link: event.html_url,
          type: jiraIssueType,
        }
      }),
    });
  } catch (error) {
    console.log("Error occurred while creating Jira issue", error);
    process.exit(1);
  }
})();

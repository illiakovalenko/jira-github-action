const github = JSON.parse(process.env.GITHUB);

const JIRA_ISSUE_TYPE = Object.freeze([
  {
    type: "bug",
    validate: (ev) => ev.issue && ev.issue.labels.includes("🐞 bug"),
  },
  {
    type: "task",
    validate: (ev) => !!ev.pull_request,
  },
  {
    type: "doc",
    validate: (ev) => ev.issue && ev.issue.labels.includes("📑 doc"),
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
  }

  // const isUserCollaborator = userInfoRes.status === 204;

  // don't create Jira issue if PR is created by collaborator
  // if (github.event.pull_request && isUserCollaborator) return;

  let webhookRes;
  try {
    await fetch(process.env.JIRA_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({
        summary: event.title,
        description: event.body,
        link: event.url,
        type: jiraIssueType,
      }),
    });

    console.log("success");
  } catch (error) {
    console.log("Error occurred while creating Jira issue", error);
  }

  console.log(webhookRes ? "success" : "failed");
})();

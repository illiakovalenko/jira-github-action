const github = JSON.parse(process.env.GITHUB);

// test

(async () => {
  const event = github.event.issue || github.event.pull_request;

  const res = await fetch(
    `https://api.github.com/repos/${github.event.repository.owner.login}/${github.event.repository.name}/collaborators/${event.user.login}`,
    {
      headers: {
        Authorization: `Bearer ${github.token}`,
      },
    }
  );

  const isUserCollaborator = res.status === 204;

  // don't create Jira issue if PR is created by collaborator
  // if (github.event.pull_request && isUserCollaborator) return;

  console.log('IS ISSUE', !!github.event.issue);
  console.log('IS PR', !!github.event.pull_request);
  console.log('USER', event.user.login);
  console.log('IS COLLABORATOR', isUserCollaborator);
  console.log(res);
})();

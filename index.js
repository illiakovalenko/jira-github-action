// console.log('test');
// console.log(JSON.stringify(process.env.GITHUB, null, 2));
const github = JSON.parse(process.env.GITHUB);

// const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN,
// })

(async () => {
  console.log(github.event.issue.user.login, github.token, process.env.GITHUB_TOKEN);

  const res = await fetch(`https://api.github.com/repos/Sitecore/jss/collaborators/${github.event.issue.user.login}`, {
    headers: {
      Authorization: `Bearer ${github.token}`
    }
  })

  console.log(res);
})();

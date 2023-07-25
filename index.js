// console.log('test');
// console.log(JSON.stringify(process.env.GITHUB, null, 2));
const github = process.env.GITHUB;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

const res = await octokit.request('GET /repos/{owner}/{repo}/collaborators/{username}', {
  owner: 'Sitecore',
  repo: 'jss',
  username: github.event.issue.user.login,
})

console.log(res);

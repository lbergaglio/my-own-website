function getGithubToken() {
  return String(process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN || '').trim();
}

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGithubJson(url, token) {
  const response = await fetch(url, {
    headers: buildHeaders(token),
  });

  if (!response || typeof response.status !== 'number') {
    const error = new Error('GitHub request failed without a valid response');
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`GitHub request failed with status ${response.status}`);
    error.statusCode = response.status === 404 ? 404 : 502;
    throw error;
  }

  return response.json();
}

function normalizeRepo(repo) {
  const ownerLogin = String(repo?.owner?.login || '').trim();
  const repoName = String(repo?.name || '').trim();
  const latestCommitAt = String(repo?.latestCommitAt || '').trim();
  const pushedAt = String(repo?.pushed_at || repo?.updated_at || '').trim();

  return {
    name: repoName || 'Repositorio sin nombre',
    description: repo?.description || '',
    url: repo?.html_url || (ownerLogin && repoName ? `https://github.com/${ownerLogin}/${repoName}` : 'https://github.com'),
    language: repo?.language || '',
    stars: Number(repo?.stargazers_count || 0),
    forks: Number(repo?.forks_count || 0),
    updatedAt: latestCommitAt || pushedAt || '',
    latestCommitAt,
    latestCommitMessage: String(repo?.latestCommitMessage || '').trim(),
    latestCommitUrl: String(repo?.latestCommitUrl || '').trim(),
    private: Boolean(repo?.private),
    fork: Boolean(repo?.fork),
    archived: Boolean(repo?.archived),
  };
}

async function enrichReposWithLatestCommit(repos, token) {
  const candidateRepos = repos.slice(0, 10);

  const enriched = await Promise.allSettled(
    candidateRepos.map(async (repo) => {
      const ownerLogin = String(repo?.owner?.login || '').trim();
      const repoName = String(repo?.name || '').trim();

      if (!ownerLogin || !repoName) {
        return repo;
      }

      const commits = await fetchGithubJson(
        `https://api.github.com/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repoName)}/commits?per_page=1`,
        token
      );

      const latestCommit = Array.isArray(commits) ? commits[0] : null;
      const latestCommitAt = String(latestCommit?.commit?.committer?.date || latestCommit?.commit?.author?.date || '').trim();

      return {
        ...repo,
        latestCommitAt,
        latestCommitMessage: String(latestCommit?.commit?.message || '').trim(),
        latestCommitUrl: String(latestCommit?.html_url || '').trim(),
      };
    })
  );

  return repos.map((repo, index) => {
    const settled = enriched[index];
    return settled.status === 'fulfilled' ? settled.value : repo;
  });
}

async function fetchGithubProfile(username) {
  const token = getGithubToken();
  const normalizedUsername = String(username || '').trim();

  if (token) {
    try {
      const user = await fetchGithubJson('https://api.github.com/user', token);
      const repos = await fetchGithubJson(
        'https://api.github.com/user/repos?affiliation=owner&visibility=all&sort=pushed&direction=desc&per_page=100',
        token
      );
      const reposWithCommits = await enrichReposWithLatestCommit(Array.isArray(repos) ? repos : [], token);

      return {
        user,
        repos: reposWithCommits.map(normalizeRepo),
        includePrivateRepos: true,
        source: 'authenticated',
      };
    } catch (error) {
      // Si el token no sirve o GitHub responde mal, caemos a la lectura pública.
    }
  }

  if (!normalizedUsername) {
    const error = new Error('GitHub username is not configured');
    error.statusCode = 500;
    throw error;
  }

  const [user, repos] = await Promise.all([
    fetchGithubJson(`https://api.github.com/users/${encodeURIComponent(normalizedUsername)}`, token),
    fetchGithubJson(
      `https://api.github.com/users/${encodeURIComponent(normalizedUsername)}/repos?sort=pushed&direction=desc&per_page=100&type=owner`,
      token
    ),
  ]);

  const reposWithCommits = await enrichReposWithLatestCommit(Array.isArray(repos) ? repos : [], token);

  return {
    user,
    repos: reposWithCommits.map(normalizeRepo),
    includePrivateRepos: false,
    source: 'public',
  };
}

module.exports = {
  fetchGithubProfile,
};
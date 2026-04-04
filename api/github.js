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

async function safeFetchJson(url, token) {
  let response;
  try {
    response = await fetch(url, {
      headers: buildHeaders(token),
    });
  } catch (error) {
    const wrapped = new Error('GitHub request failed before receiving a response');
    wrapped.statusCode = 502;
    throw wrapped;
  }

  const status = Number(response?.status || 0);
  if (!response || !response.ok) {
    const wrapped = new Error(`GitHub request failed with status ${status || 'unknown'}`);
    wrapped.statusCode = status === 404 ? 404 : 502;
    throw wrapped;
  }

  return response.json();
}

function normalizeRepo(repo) {
  return {
    name: String(repo?.name || 'Repositorio sin nombre'),
    description: String(repo?.description || ''),
    url: String(repo?.html_url || ''),
    language: String(repo?.language || ''),
    stars: Number(repo?.stargazers_count || 0),
    forks: Number(repo?.forks_count || 0),
    updatedAt: String(repo?.pushed_at || repo?.updated_at || ''),
    latestCommitAt: '',
    latestCommitMessage: '',
    latestCommitUrl: '',
    private: Boolean(repo?.private),
    fork: Boolean(repo?.fork),
    archived: Boolean(repo?.archived),
  };
}

async function addLatestCommit(repo, token) {
  const owner = String(repo?.owner?.login || '').trim();
  const name = String(repo?.name || '').trim();

  if (!owner || !name) {
    return normalizeRepo(repo);
  }

  try {
    const commits = await safeFetchJson(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits?per_page=1`,
      token
    );
    const latest = Array.isArray(commits) ? commits[0] : null;
    const normalized = normalizeRepo(repo);
    return {
      ...normalized,
      latestCommitAt: String(latest?.commit?.committer?.date || latest?.commit?.author?.date || normalized.updatedAt || ''),
      latestCommitMessage: String(latest?.commit?.message || ''),
      latestCommitUrl: String(latest?.html_url || ''),
    };
  } catch (error) {
    return normalizeRepo(repo);
  }
}

async function fetchProfile(username) {
  const token = getGithubToken();
  const normalizedUsername = String(username || '').trim();

  if (token) {
    try {
      const user = await safeFetchJson('https://api.github.com/user', token);
      const repos = await safeFetchJson(
        'https://api.github.com/user/repos?affiliation=owner&visibility=all&sort=pushed&direction=desc&per_page=100',
        token
      );

      const repoList = Array.isArray(repos) ? repos : [];
      const normalized = await Promise.all(repoList.slice(0, 30).map((repo) => addLatestCommit(repo, token)));

      return {
        user,
        repos: normalized,
        includePrivateRepos: true,
        source: 'authenticated',
      };
    } catch (error) {
      // If authenticated mode fails, continue with public mode.
    }
  }

  if (!normalizedUsername) {
    const error = new Error('GitHub username is not configured');
    error.statusCode = 500;
    throw error;
  }

  const [user, repos] = await Promise.all([
    safeFetchJson(`https://api.github.com/users/${encodeURIComponent(normalizedUsername)}`, ''),
    safeFetchJson(
      `https://api.github.com/users/${encodeURIComponent(normalizedUsername)}/repos?sort=pushed&direction=desc&per_page=100&type=owner`,
      ''
    ),
  ]);

  const repoList = Array.isArray(repos) ? repos : [];
  const normalized = await Promise.all(repoList.slice(0, 30).map((repo) => addLatestCommit(repo, '')));

  return {
    user,
    repos: normalized,
    includePrivateRepos: false,
    source: 'public',
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const username = String(req.query?.username || process.env.GITHUB_USERNAME || '').trim();
    const payload = await fetchProfile(username);
    return res.status(200).json(payload);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Unable to load GitHub data' });
  }
};
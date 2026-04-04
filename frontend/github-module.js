export function create(deps) {
  const {
    refs,
    getLocaleText,
    getCurrentLocale,
    getGithubUsername,
    getCacheMinutes,
    cacheKey,
    escapeHTML,
    formatRelativeDate,
  } = deps;

  function createStatCard(label, value) {
      const article = document.createElement('article');
      article.className = 'github-stat';
      article.innerHTML = `
        <span class="github-stat-label">${escapeHTML(label)}</span>
        <strong class="github-stat-value">${escapeHTML(value)}</strong>
      `;
      return article;
    }

  function renderSkeleton() {
      if (!refs.githubStats) {
        return;
      }

      refs.githubStats.innerHTML = '';
      const localeText = getLocaleText();

      const placeholders = [
        [localeText.githubStats.repos, '—'],
        [localeText.githubStats.stars, '—'],
        [localeText.githubStats.followers, '—'],
        [localeText.githubStats.updated, '—'],
      ];

      placeholders.forEach(([label, value]) => {
        refs.githubStats.appendChild(createStatCard(label, value));
      });

      const featured = document.createElement('article');
      featured.className = 'github-featured';
      featured.innerHTML = `
        <div class="github-featured-head">
          <div>
            <p class="meta">${escapeHTML(localeText.githubStats.featured)}</p>
            <h3 class="github-featured-title">${escapeHTML(localeText.githubStats.loadingTitle)}</h3>
          </div>
        </div>
        <p class="github-featured-body">${escapeHTML(localeText.githubStats.loadingBody)}</p>
        <div class="github-featured-meta">
          <span class="github-pill">${getCurrentLocale() === 'en' ? 'Auto-refresh from GitHub' : 'Auto-refresh desde GitHub'}</span>
        </div>
      `;
      refs.githubStats.appendChild(featured);
    }

  function render(stats, error) {
      if (!refs.githubStats) {
        return;
      }

      refs.githubStats.innerHTML = '';
      const localeText = getLocaleText();

      if (!stats) {
        refs.githubStats.appendChild(createStatCard('GitHub', error ? (getCurrentLocale() === 'en' ? 'Unavailable' : 'No disponible') : (getCurrentLocale() === 'en' ? 'No data' : 'Sin datos')));
        const fallback = document.createElement('article');
        fallback.className = 'github-featured';
        fallback.innerHTML = `
          <div class="github-featured-head">
            <div>
              <p class="meta">${escapeHTML(localeText.githubStats.featured)}</p>
              <h3 class="github-featured-title">${escapeHTML(localeText.githubStats.noDataTitle)}</h3>
            </div>
          </div>
          <p class="github-featured-body">${escapeHTML(localeText.githubStats.noDataBody)}</p>
        `;
        refs.githubStats.appendChild(fallback);
        return;
      }

      [
        [localeText.githubStats.repos, String(stats.publicRepos)],
        [localeText.githubStats.stars, String(stats.stars)],
        [localeText.githubStats.followers, String(stats.followers)],
        [localeText.githubStats.updated, stats.lastUpdateLabel],
      ].forEach(([label, value]) => {
        refs.githubStats.appendChild(createStatCard(label, value));
      });

      const featured = document.createElement('article');
      featured.className = 'github-featured';
      featured.innerHTML = `
        <div class="github-featured-head">
          <div>
            <p class="meta">${escapeHTML(localeText.githubStats.featured)}</p>
            <h3 class="github-featured-title">${escapeHTML(stats.featuredRepo.name)}</h3>
          </div>
          <a class="github-featured-link" href="${escapeHTML(stats.featuredRepo.url)}" target="_blank" rel="noreferrer noopener">Abrir</a>
        </div>
        <p class="github-featured-body">${escapeHTML(stats.featuredRepo.description)}</p>
        <div class="github-featured-meta">
          ${stats.featuredRepo.language ? `<span class="github-pill">${escapeHTML(stats.featuredRepo.language)}</span>` : ''}
          <span class="github-pill">⭐ ${stats.featuredRepo.stars}</span>
          <span class="github-pill">Forks ${stats.featuredRepo.forks}</span>
          <span class="github-pill">Actualizado ${escapeHTML(stats.featuredRepo.updatedAtLabel)}</span>
        </div>
      `;
      refs.githubStats.appendChild(featured);
    }

  function normalizeFeaturedRepo(repo) {
      if (!repo) {
        return {
          name: 'Sin repositorio destacado',
          description: 'Crea un repositorio público para mostrar actividad en vivo.',
          url: `https://github.com/${getGithubUsername()}`,
          language: '',
          stars: 0,
          forks: 0,
          updatedAtLabel: 'hoy',
        };
      }

      return {
        name: repo.name || 'Repositorio sin nombre',
        description: repo.description || 'Sin descripción disponible.',
        url: repo.html_url || `https://github.com/${getGithubUsername()}`,
        language: repo.language || '',
        stars: Number(repo.stargazers_count || 0),
        forks: Number(repo.forks_count || 0),
        updatedAtLabel: formatRelativeDate(repo.updated_at || new Date().toISOString()),
      };
    }

  function normalizeGithubStats(user, repos) {
      const repoList = Array.isArray(repos) ? repos : [];
      const featuredRepoSource = repoList
        .filter((repo) => !repo.fork)
        .sort((left, right) => (right.stargazers_count || 0) - (left.stargazers_count || 0) || new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0]
        || repoList[0]
        || null;

      const stars = repoList.reduce((total, repo) => total + Number(repo.stargazers_count || 0), 0);

      return {
        publicRepos: Number(user.public_repos || repoList.length || 0),
        stars,
        followers: Number(user.followers || 0),
        lastUpdateLabel: formatRelativeDate(user.updated_at || new Date().toISOString()),
        featuredRepo: normalizeFeaturedRepo(featuredRepoSource),
      };
    }

  function loadCache() {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) {
          return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
          return null;
        }

        return parsed;
      } catch (error) {
        return null;
      }
    }

  function saveCache(stats) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), stats }));
      } catch (error) {
        return;
      }
    }

  async function loadGithubStats(username) {
      const cached = loadCache();
      if (cached && Date.now() - cached.cachedAt < getCacheMinutes() * 60 * 1000) {
        return cached.stats;
      }

      const [userResponse, reposResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
          headers: { Accept: 'application/vnd.github+json' },
        }),
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=20&type=owner`, {
          headers: { Accept: 'application/vnd.github+json' },
        }),
      ]);

      if (!userResponse.ok || !reposResponse.ok) {
        throw new Error('No se pudo consultar la API de GitHub');
      }

      const user = await userResponse.json();
      const repos = await reposResponse.json();
      const stats = normalizeGithubStats(user, repos);
      saveCache(stats);
      return stats;
    }

  async function loadAndRender() {
      if (!refs.githubStats) {
        return;
      }

      const username = getGithubUsername();
      if (!username) {
        refs.githubStats.innerHTML = '';
        refs.githubStats.appendChild(createStatCard('GitHub', getCurrentLocale() === 'en' ? 'Configure username' : 'Configurar usuario'));
        return;
      }

      try {
        const stats = await loadGithubStats(username);
        render(stats);
      } catch (error) {
        render(null, error);
      }
    }

  return {
    renderSkeleton,
    loadAndRender,
    render,
    createStatCard,
  };
}

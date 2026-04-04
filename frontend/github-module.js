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

  const GITHUB_API_ENDPOINT = '/api/github';

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
        [localeText.githubStats.privateRepos, '—'],
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
        [localeText.githubStats.privateRepos, String(stats.privateRepos)],
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
          ${stats.includePrivateRepos ? `<span class="github-pill">${escapeHTML(localeText.githubStats.privateAccess)}</span>` : ''}
          ${stats.featuredRepo.private ? `<span class="github-pill">Privado</span>` : ''}
          ${stats.featuredRepo.language ? `<span class="github-pill">${escapeHTML(stats.featuredRepo.language)}</span>` : ''}
          <span class="github-pill">⭐ ${stats.featuredRepo.stars}</span>
          <span class="github-pill">Forks ${stats.featuredRepo.forks}</span>
          <span class="github-pill">Actualizado ${escapeHTML(stats.featuredRepo.updatedAtLabel)}</span>
        </div>
        ${stats.featuredRepo.latestCommitMessage ? `<p class="github-featured-body"><strong>${escapeHTML(localeText.githubStats.latestCommit)}:</strong> ${escapeHTML(stats.featuredRepo.latestCommitMessage)}</p>` : ''}
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
        url: repo.url || `https://github.com/${getGithubUsername()}`,
        language: repo.language || '',
        stars: Number(repo.stars || 0),
        forks: Number(repo.forks || 0),
        updatedAtLabel: formatRelativeDate(repo.latestCommitAt || repo.updatedAt || new Date().toISOString()),
        latestCommitMessage: repo.latestCommitMessage || '',
        latestCommitUrl: repo.latestCommitUrl || '',
        private: Boolean(repo.private),
      };
    }

  function normalizeGithubStats(user, repos) {
      const repoList = Array.isArray(repos) ? repos : [];
      const featuredRepoSource = repoList
        .filter((repo) => !repo.fork && !repo.archived)
        .sort((left, right) => {
          const rightDate = new Date(right.latestCommitAt || right.updatedAt || 0).getTime();
          const leftDate = new Date(left.latestCommitAt || left.updatedAt || 0).getTime();

          if (rightDate !== leftDate) {
            return rightDate - leftDate;
          }

          return (right.stars || 0) - (left.stars || 0);
        })[0]
        || repoList[0]
        || null;

      const stars = repoList.reduce((total, repo) => total + Number(repo.stars || 0), 0);
      const privateRepos = repoList.filter((repo) => repo.private).length;
      const latestActivityDate = repoList.reduce((latest, repo) => {
        const candidate = repo.latestCommitAt || repo.updatedAt || '';
        if (!candidate) {
          return latest;
        }

        if (!latest) {
          return candidate;
        }

        return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest;
      }, '');

      return {
        publicRepos: Number(repoList.length || user.public_repos || 0),
        privateRepos,
        stars,
        followers: Number(user.followers || 0),
        lastUpdateLabel: formatRelativeDate(latestActivityDate || user.updated_at || new Date().toISOString()),
        featuredRepo: normalizeFeaturedRepo(featuredRepoSource),
        includePrivateRepos: Boolean(user && (privateRepos > 0 || repoList.some((repo) => repo.private))),
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

      const response = await fetch(`${GITHUB_API_ENDPOINT}?username=${encodeURIComponent(username)}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('No se pudo consultar la API de GitHub');
      }

      const payload = await response.json();
      const stats = normalizeGithubStats(payload.user || {}, payload.repos || []);
      stats.includePrivateRepos = Boolean(payload.includePrivateRepos || stats.includePrivateRepos);
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

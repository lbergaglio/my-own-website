// Claves de persistencia local y endpoint del CMS.
const STORAGE_KEY = 'cv-content-v1';
const API_ENDPOINT = '/api/content';
const GITHUB_STATS_CACHE_KEY = 'cv-github-stats-v1';

// Config runtime inyectada desde config.js.
const RUNTIME_CONFIG = window.__CV_CONFIG || {};
const normalizedAuth0Domain = normalizeAuth0Domain(RUNTIME_CONFIG.auth0Domain || '');
const AUTH0_REDIRECT_URI = RUNTIME_CONFIG.auth0RedirectUri || window.location.origin;
const AUTH0_CONNECTION = String(RUNTIME_CONFIG.auth0Connection || '').trim();
const GITHUB_USERNAME = String(RUNTIME_CONFIG.githubUsername || '').trim();
const GITHUB_STATS_CACHE_MINUTES = Number(RUNTIME_CONFIG.githubStatsCacheMinutes || 30);

// Parametros de autenticacion para Auth0 SPA SDK.
const AUTH0_CONFIG = {
  domain: normalizedAuth0Domain || 'REEMPLAZAR_TU_DOMINIO.auth0.com',
  clientId: RUNTIME_CONFIG.auth0ClientId || 'REEMPLAZAR_CLIENT_ID',
  audience: RUNTIME_CONFIG.auth0Audience || '',
};
const AUTH0_SCOPE = 'openid profile email';
const AUTH_INTENT_KEY = 'cv-admin-auth-intent';
const { defaultContent, normalizeContent } = window.CV_CONTENT_MODEL || {};

if (!defaultContent || !normalizeContent) {
  throw new Error('content-model.js must be loaded before script.js');
}

// Referencias a nodos de UI para renderizar contenido publico.
const refs = {
  heroBadge: document.getElementById('hero-badge'),
  heroName: document.getElementById('hero-name'),
  heroRole: document.getElementById('hero-role'),
  heroSummary: document.getElementById('hero-summary'),
  factsList: document.getElementById('facts-list'),
  aboutText: document.getElementById('about-text'),
  experienceList: document.getElementById('experience-list'),
  projectList: document.getElementById('project-list'),
  githubStats: document.getElementById('github-stats'),
  skillsList: document.getElementById('skills-list'),
  contactMessage: document.getElementById('contact-message'),
  contactEmail: document.getElementById('contact-email'),
  socialLinks: document.getElementById('social-links'),
  footerSocialLinks: document.getElementById('footer-social-links'),
  footerName: document.getElementById('footer-name'),
  year: document.getElementById('year'),
};

// Referencias al panel administrativo y modal de login.
const admin = {
  panel: document.getElementById('admin-panel'),
  openBtn: document.getElementById('open-admin'),
  closeBtn: document.getElementById('close-admin'),
  logoutBtn: document.getElementById('logout-admin'),
  form: document.getElementById('admin-form'),
  resetBtn: document.getElementById('reset-content'),
  downloadBtn: document.getElementById('download-content'),
  uploadInput: document.getElementById('upload-content'),
  authModal: document.getElementById('auth-modal'),
  authForm: document.getElementById('auth-form'),
  authLoginBtn: document.getElementById('auth-login'),
  authError: document.getElementById('auth-error'),
  authCancel: document.getElementById('auth-cancel'),
};

// Cliente Auth0 lazy (promesa compartida para evitar multiples instancias).
const auth0ClientPromise = createAuth0ClientInstance();

// Estado en memoria del contenido actual del CV.
let cvContent = loadCachedContent() || structuredClone(defaultContent);

// Render inicial inmediato para reducir tiempo a primer contenido.
render(cvContent);
populateForm(cvContent);
initReveal();
bindAdminActions();
void bootstrap();

// Inicializacion asincronica: prioriza CMS remoto y luego auth/github.
async function bootstrap() {
  cvContent = await loadContent();
  render(cvContent);
  populateForm(cvContent);
  void loadAndRenderGithubStats();
  await initializeAuthFlow();
}

// Obtiene contenido desde API serverless.
async function fetchRemoteContent() {
  const response = await fetch(API_ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Failed to load content from API');
  }

  return normalizeContent(await response.json());
}

// Estrategia de carga: remoto primero, cache/local como fallback.
async function loadContent() {
  try {
    const remoteContent = await fetchRemoteContent();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteContent));
    return remoteContent;
  } catch (error) {
    return loadCachedContent() || structuredClone(defaultContent);
  }
}

// Lee cache local y la normaliza para evitar datos corruptos.
function loadCachedContent() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeContent(parsed);
  } catch (error) {
    return null;
  }
}

// Renderiza todas las secciones visibles del sitio a partir del modelo de contenido.
function render(content) {
  refs.heroBadge.textContent = content.badge;
  refs.heroName.textContent = content.name;
  refs.heroRole.textContent = content.role;
  refs.heroSummary.textContent = content.summary;
  refs.aboutText.textContent = content.about;
  refs.contactMessage.textContent = content.contactMessage;
  refs.contactEmail.textContent = content.email;
  refs.contactEmail.href = `mailto:${content.email}`;
  refs.footerName.textContent = content.name;
  refs.year.textContent = String(new Date().getFullYear());
  document.title = `CV Profesional | ${content.name}`;

  const socialItems = [
    { label: 'LinkedIn', url: content.social.linkedin },
    { label: 'GitHub', url: content.social.github },
    { label: 'Portfolio', url: content.social.portfolio },
    { label: 'X', url: content.social.twitter },
  ].filter((item) => item.url && item.url.trim().length > 0);

  refs.socialLinks.innerHTML = '';
  refs.footerSocialLinks.innerHTML = '';
  socialItems.forEach((item) => {
    refs.socialLinks.appendChild(createSocialLink(item.label, item.url));
    refs.footerSocialLinks.appendChild(createSocialLink(item.label, item.url));
  });

  refs.factsList.innerHTML = '';
  [
    `Ubicacion: ${content.location}`,
    `Email: ${content.email}`,
    `Telefono: ${content.phone}`,
    `Idiomas: ${content.languages}`,
  ].forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    refs.factsList.appendChild(li);
  });

  refs.experienceList.innerHTML = '';
  content.experience.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'card reveal';
    article.innerHTML = `
      <p class="meta">${escapeHTML(item.period)}</p>
      <h3>${escapeHTML(item.title)}</h3>
      <p class="body-text">${escapeHTML(item.description)}</p>
    `;
    refs.experienceList.appendChild(article);
  });

  refs.projectList.innerHTML = '';
  content.projects.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'card reveal';
    article.innerHTML = `
      <h3>${escapeHTML(item.title)}</h3>
      <p class="body-text">${escapeHTML(item.description)}</p>
      <p class="stack">${escapeHTML(item.stack)}</p>
    `;
    refs.projectList.appendChild(article);
  });

  if (refs.githubStats && refs.githubStats.children.length === 0) {
    renderGithubStatsSkeleton();
  }

  refs.skillsList.innerHTML = '';
  content.skills.forEach((skill) => {
    const span = document.createElement('span');
    span.className = 'skill-item';
    span.textContent = skill;
    refs.skillsList.appendChild(span);
  });

  initReveal();
}

// Completa el formulario admin con el estado actual del contenido.
function populateForm(content) {
  admin.form.elements.name.value = content.name;
  admin.form.elements.role.value = content.role;
  admin.form.elements.badge.value = content.badge;
  admin.form.elements.summary.value = content.summary;
  admin.form.elements.about.value = content.about;
  admin.form.elements.location.value = content.location;
  admin.form.elements.email.value = content.email;
  admin.form.elements.phone.value = content.phone;
  admin.form.elements.languages.value = content.languages;
  admin.form.elements.linkedin.value = content.social.linkedin;
  admin.form.elements.github.value = content.social.github;
  admin.form.elements.portfolio.value = content.social.portfolio;
  admin.form.elements.twitter.value = content.social.twitter;
  admin.form.elements.contactMessage.value = content.contactMessage;
  admin.form.elements.skills.value = content.skills.join(', ');
  admin.form.elements.experience.value = content.experience
    .map((item) => `${item.period} | ${item.title} | ${item.description}`)
    .join('\n');
  admin.form.elements.projects.value = content.projects
    .map((item) => `${item.title} | ${item.description} | ${item.stack}`)
    .join('\n');
}

// Conecta listeners de UI para acciones administrativas y utilidades JSON.
function bindAdminActions() {
  admin.openBtn.addEventListener('click', async () => {
    if (await isAuthenticated()) {
      openAdminPanel();
      return;
    }

    openAuthModal();
  });

  admin.closeBtn.addEventListener('click', () => {
    closeAdminPanel();
  });

  admin.logoutBtn.addEventListener('click', () => {
    void logoutAuth0();
  });

  admin.authCancel.addEventListener('click', () => {
    closeAuthModal();
  });

  admin.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loginAuth0();
  });

  admin.form.addEventListener('submit', (event) => {
    event.preventDefault();
    void saveSubmittedContent();
  });

  admin.resetBtn.addEventListener('click', () => {
    void resetContent();
  });

  admin.downloadBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(cvContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv-content.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  admin.uploadInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      cvContent = normalizeContent(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cvContent));
      render(cvContent);
      populateForm(cvContent);
      alert('JSON cargado correctamente.');
    } catch (error) {
      alert('El archivo JSON no es valido.');
    } finally {
      admin.uploadInput.value = '';
    }
  });
}

// Guarda cambios del formulario y refresca UI/cache.
async function saveSubmittedContent() {
  const next = collectFormData();
  if (!next) {
    alert('Revisa el formato de Experiencia y Proyectos. Usa: campo | campo | campo');
    return;
  }

  try {
    const saved = await saveContent(next);
    cvContent = saved;
    render(cvContent);
    populateForm(cvContent);
    alert('Contenido guardado en el CMS.');
  } catch (error) {
    alert(error.message || 'No se pudo guardar el contenido.');
  }
}

// Restaura contenido por defecto y lo persiste remotamente.
async function resetContent() {
  try {
    const saved = await saveContent(structuredClone(defaultContent));
    cvContent = saved;
    render(cvContent);
    populateForm(cvContent);
    localStorage.removeItem(STORAGE_KEY);
    alert('Contenido restaurado y guardado.');
  } catch (error) {
    alert(error.message || 'No se pudo restaurar el contenido.');
  }
}

// Persiste contenido en API protegida con token Auth0.
async function saveContent(nextContent) {
  const response = await fetch(API_ENDPOINT, {
    method: 'PUT',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(normalizeContent(nextContent)),
  });

  if (!response.ok) {
    const errorData = await readErrorResponse(response);
    throw new Error(errorData.error || 'No se pudo guardar el contenido.');
  }

  const saved = normalizeContent(await response.json());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

// Construye headers de autorizacion para endpoints protegidos.
async function buildAuthHeaders() {
  const client = await getAuth0Client();
  if (!client) {
    throw new Error('Auth0 no esta configurado.');
  }

  const accessToken = await client.getTokenSilently({
    authorizationParams: {
      redirect_uri: AUTH0_REDIRECT_URI,
      scope: AUTH0_SCOPE,
      audience: AUTH0_CONFIG.audience || undefined,
    },
  });

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

// Intenta parsear error JSON del backend sin romper flujo.
async function readErrorResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    return { error: 'Respuesta invalida del servidor' };
  }
}

// Control visual del panel admin.
function openAdminPanel() {
  admin.panel.classList.add('open');
  admin.panel.setAttribute('aria-hidden', 'false');
}

function closeAdminPanel() {
  admin.panel.classList.remove('open');
  admin.panel.setAttribute('aria-hidden', 'true');
}

// Abre modal de auth y valida configuracion minima de Auth0.
function openAuthModal() {
  admin.authModal.classList.add('open');
  admin.authModal.setAttribute('aria-hidden', 'false');
  admin.authError.textContent = '';

  if (!isAuthConfigured()) {
    admin.authError.textContent =
      'Auth0 no esta configurado. Edita AUTH0_CONFIG en script.js.';
    return;
  }

  admin.authLoginBtn.focus();
}

// Cierra modal de auth.
function closeAuthModal() {
  admin.authModal.classList.remove('open');
  admin.authModal.setAttribute('aria-hidden', 'true');
}

// Consulta estado de sesion en Auth0.
async function isAuthenticated() {
  const client = await getAuth0Client();
  if (!client) {
    return false;
  }

  try {
    return await client.isAuthenticated();
  } catch (error) {
    return false;
  }
}

// Crea cliente Auth0 solo si el SDK y la configuracion estan disponibles.
async function createAuth0ClientInstance() {
  if (!window.auth0 || !isAuthConfigured()) {
    return null;
  }

  const client = await window.auth0.createAuth0Client({
    domain: AUTH0_CONFIG.domain,
    clientId: AUTH0_CONFIG.clientId,
    authorizationParams: {
      redirect_uri: AUTH0_REDIRECT_URI,
      scope: AUTH0_SCOPE,
      audience: AUTH0_CONFIG.audience || undefined,
    },
    cacheLocation: 'localstorage',
  });

  return client;
}

// Verifica placeholders para evitar intentos de auth incompletos.
function isAuthConfigured() {
  return (
    AUTH0_CONFIG.domain &&
    AUTH0_CONFIG.domain !== 'REEMPLAZAR_TU_DOMINIO.auth0.com' &&
    AUTH0_CONFIG.clientId &&
    AUTH0_CONFIG.clientId !== 'REEMPLAZAR_CLIENT_ID'
  );
}

// Accessor central para cliente Auth0.
async function getAuth0Client() {
  return auth0ClientPromise;
}

// Login principal: popup; fallback a redirect cuando el navegador bloquea popups.
async function loginAuth0() {
  admin.authError.textContent = '';

  const client = await getAuth0Client();
  if (!client) {
    admin.authError.textContent =
      'Auth0 no esta configurado. Edita AUTH0_CONFIG en script.js.';
    return;
  }

  try {
    const authorizationParams = {
      redirect_uri: AUTH0_REDIRECT_URI,
      scope: AUTH0_SCOPE,
      audience: AUTH0_CONFIG.audience || undefined,
      connection: AUTH0_CONNECTION || undefined,
    };

    await client.loginWithPopup({ authorizationParams });

    if (await client.isAuthenticated()) {
      closeAuthModal();
      openAdminPanel();
    }
  } catch (error) {
    const errorCode = error?.error || error?.code || '';
    if (errorCode.includes('popup')) {
      sessionStorage.setItem(AUTH_INTENT_KEY, 'open-admin');
      await client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: AUTH0_REDIRECT_URI,
          scope: AUTH0_SCOPE,
          audience: AUTH0_CONFIG.audience || undefined,
          connection: AUTH0_CONNECTION || undefined,
        },
      });
      return;
    }

    admin.authError.textContent = getAuthErrorMessage(error);
  }
}

// Logout local del cliente Auth0 sin abandonar la pagina.
async function logoutAuth0() {
  closeAdminPanel();

  const client = await getAuth0Client();
  if (!client) {
    alert('Sesion cerrada.');
    return;
  }

  await client.logout({ openUrl: false });

  alert('Sesion cerrada.');
}

// Convierte el formulario admin a estructura de contenido normalizada.
function collectFormData() {
  const form = admin.form.elements;

  const experience = parsePipeLines(form.experience.value, ['period', 'title', 'description']);
  const projects = parsePipeLines(form.projects.value, ['title', 'description', 'stack']);

  if (!experience || !projects) {
    return null;
  }

  return {
    name: form.name.value.trim(),
    role: form.role.value.trim(),
    badge: form.badge.value.trim(),
    summary: form.summary.value.trim(),
    about: form.about.value.trim(),
    location: form.location.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    languages: form.languages.value.trim(),
    social: {
      linkedin: form.linkedin.value.trim(),
      github: form.github.value.trim(),
      portfolio: form.portfolio.value.trim(),
      twitter: form.twitter.value.trim(),
    },
    contactMessage: form.contactMessage.value.trim(),
    skills: form.skills.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    experience,
    projects,
  };
}

// Crea ancla social segura hacia URL externa.
function createSocialLink(label, url) {
  const anchor = document.createElement('a');
  anchor.className = 'social-link';
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer noopener';
  anchor.textContent = label;
  return anchor;
}

// Estado visual temporal mientras se consulta GitHub API.
function renderGithubStatsSkeleton() {
  if (!refs.githubStats) {
    return;
  }

  refs.githubStats.innerHTML = '';

  const placeholders = [
    ['Repos públicos', '—'],
    ['Estrellas', '—'],
    ['Seguidores', '—'],
    ['Ultima actualización', '—'],
  ];

  placeholders.forEach(([label, value]) => {
    refs.githubStats.appendChild(createStatCard(label, value));
  });

  const featured = document.createElement('article');
  featured.className = 'github-featured';
  featured.innerHTML = `
    <div class="github-featured-head">
      <div>
        <p class="meta">Repositorio destacado</p>
        <h3 class="github-featured-title">Cargando actividad de GitHub</h3>
      </div>
    </div>
    <p class="github-featured-body">La pagina consulta la API publica de GitHub para mostrar estadisticas y repositorios recientes.</p>
    <div class="github-featured-meta">
      <span class="github-pill">Auto-refresh desde GitHub</span>
    </div>
  `;
  refs.githubStats.appendChild(featured);
}

// Fabrica de tarjetas de estadistica.
function createStatCard(label, value) {
  const article = document.createElement('article');
  article.className = 'github-stat';
  article.innerHTML = `
    <span class="github-stat-label">${escapeHTML(label)}</span>
    <strong class="github-stat-value">${escapeHTML(value)}</strong>
  `;
  return article;
}

// Orquesta carga de estadisticas de GitHub y render con manejo de errores.
async function loadAndRenderGithubStats() {
  if (!refs.githubStats) {
    return;
  }

  if (!GITHUB_USERNAME) {
    refs.githubStats.innerHTML = '';
    refs.githubStats.appendChild(createStatCard('GitHub', 'Configurar usuario'));
    return;
  }

  try {
    const stats = await loadGithubStats(GITHUB_USERNAME);
    renderGithubStats(stats);
  } catch (error) {
    renderGithubStats(null, error);
  }
}

// Render final de cards GitHub con fallback si no hay datos.
function renderGithubStats(stats, error) {
  if (!refs.githubStats) {
    return;
  }

  refs.githubStats.innerHTML = '';

  if (!stats) {
    refs.githubStats.appendChild(createStatCard('GitHub', error ? 'No disponible' : 'Sin datos'));
    const fallback = document.createElement('article');
    fallback.className = 'github-featured';
    fallback.innerHTML = `
      <div class="github-featured-head">
        <div>
          <p class="meta">Repositorio destacado</p>
          <h3 class="github-featured-title">No se pudo cargar la actividad</h3>
        </div>
      </div>
      <p class="github-featured-body">Revisa la conexion a internet o el nombre de usuario configurado en <code>config.js</code>.</p>
    `;
    refs.githubStats.appendChild(fallback);
    return;
  }

  [
    ['Repos públicos', String(stats.publicRepos)],
    ['Estrellas', String(stats.stars)],
    ['Seguidores', String(stats.followers)],
    ['Ultima actualización', stats.lastUpdateLabel],
  ].forEach(([label, value]) => {
    refs.githubStats.appendChild(createStatCard(label, value));
  });

  const featured = document.createElement('article');
  featured.className = 'github-featured';
  featured.innerHTML = `
    <div class="github-featured-head">
      <div>
        <p class="meta">Repositorio destacado</p>
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

// Consulta API publica de GitHub y aplica cache temporal en localStorage.
async function loadGithubStats(username) {
  const cached = loadGithubStatsCache();
  if (cached && Date.now() - cached.cachedAt < GITHUB_STATS_CACHE_MINUTES * 60 * 1000) {
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

  saveGithubStatsCache(stats);
  return stats;
}

// Normaliza payload de GitHub en un modelo listo para UI.
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

// Elige repositorio destacado o construye fallback amigable.
function normalizeFeaturedRepo(repo) {
  if (!repo) {
    return {
      name: 'Sin repositorio destacado',
      description: 'Crea un repositorio público para mostrar actividad en vivo.',
      url: `https://github.com/${GITHUB_USERNAME}`,
      language: '',
      stars: 0,
      forks: 0,
      updatedAtLabel: 'hoy',
    };
  }

  return {
    name: repo.name || 'Repositorio sin nombre',
    description: repo.description || 'Sin descripción disponible.',
    url: repo.html_url || `https://github.com/${GITHUB_USERNAME}`,
    language: repo.language || '',
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    updatedAtLabel: formatRelativeDate(repo.updated_at || new Date().toISOString()),
  };
}

// Lectura tolerante a fallos de cache de estadisticas GitHub.
function loadGithubStatsCache() {
  try {
    const raw = localStorage.getItem(GITHUB_STATS_CACHE_KEY);
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

// Persistencia best-effort del cache GitHub.
function saveGithubStatsCache(stats) {
  try {
    localStorage.setItem(
      GITHUB_STATS_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), stats })
    );
  } catch (error) {
    return;
  }
}

// Convierte fecha ISO a etiqueta relativa en espanol.
function formatRelativeDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'sin fecha';
  }

  const now = new Date();
  const diffInDays = Math.max(0, Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));

  if (diffInDays === 0) {
    return 'hoy';
  }

  if (diffInDays === 1) {
    return 'hace 1 día';
  }

  if (diffInDays < 30) {
    return `hace ${diffInDays} días`;
  }

  const months = Math.round(diffInDays / 30);
  if (months === 1) {
    return 'hace 1 mes';
  }

  return `hace ${months} meses`;
}

// Parsea lineas con formato: campo | campo | campo.
function parsePipeLines(text, keys) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const result = [];
  for (const line of lines) {
    const parts = line.split('|').map((item) => item.trim());
    if (parts.length !== keys.length || parts.some((value) => !value)) {
      return null;
    }

    const entry = {};
    keys.forEach((key, index) => {
      entry[key] = parts[index];
    });
    result.push(entry);
  }

  return result;
}

// Observer de interseccion para animaciones reveal por scroll.
function initReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (window.__cvRevealObserver) {
    window.__cvRevealObserver.disconnect();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.18 }
  );

  window.__cvRevealObserver = observer;

  revealElements.forEach((element, index) => {
    if (!element.classList.contains('visible')) {
      element.style.transitionDelay = `${index * 50}ms`;
    }
    observer.observe(element);
  });
}

// Escape defensivo para interpolaciones HTML seguras.
function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Permite configurar Auth0 con dominio corto o completo.
function normalizeAuth0Domain(domain) {
  const clean = String(domain).trim();
  if (!clean) {
    return '';
  }

  if (clean.includes('.')) {
    return clean;
  }

  return `${clean}.auth0.com`;
}

// Completa callbacks de redirect de Auth0 y reabre admin si habia intencion previa.
async function initializeAuthFlow() {
  const client = await getAuth0Client();
  if (!client) {
    return;
  }

  const search = new URLSearchParams(window.location.search);
  const hasAuthParams = search.has('code') && search.has('state');

  if (hasAuthParams) {
    try {
      await client.handleRedirectCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      admin.authError.textContent = getAuthErrorMessage(error);
    }
  }

  const shouldOpenAdmin = sessionStorage.getItem(AUTH_INTENT_KEY) === 'open-admin';
  if (shouldOpenAdmin && (await client.isAuthenticated())) {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
    closeAuthModal();
    openAdminPanel();
  }
}

// Traduce errores comunes de Auth0 a mensajes mas accionables.
function getAuthErrorMessage(error) {
  const message = String(error?.message || error?.error_description || '').toLowerCase();
  if (message.includes('callback url mismatch') || message.includes('redirect_uri')) {
    return 'Error de callback en Auth0. Revisa Allowed Callback URLs.';
  }

  if (message.includes('access_denied')) {
    return 'Acceso denegado por Auth0 o por la conexion social configurada.';
  }

  return 'No se pudo iniciar sesion con Auth0.';
}

const STORAGE_KEY = 'cv-content-v1';
const API_ENDPOINT = '/api/content';
const RUNTIME_CONFIG = window.__CV_CONFIG || {};
const normalizedAuth0Domain = normalizeAuth0Domain(RUNTIME_CONFIG.auth0Domain || '');
const AUTH0_REDIRECT_URI = RUNTIME_CONFIG.auth0RedirectUri || window.location.origin;
const AUTH0_CONNECTION = String(RUNTIME_CONFIG.auth0Connection || '').trim();
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

const refs = {
  heroBadge: document.getElementById('hero-badge'),
  heroName: document.getElementById('hero-name'),
  heroRole: document.getElementById('hero-role'),
  heroSummary: document.getElementById('hero-summary'),
  factsList: document.getElementById('facts-list'),
  aboutText: document.getElementById('about-text'),
  experienceList: document.getElementById('experience-list'),
  projectList: document.getElementById('project-list'),
  skillsList: document.getElementById('skills-list'),
  contactMessage: document.getElementById('contact-message'),
  contactEmail: document.getElementById('contact-email'),
  socialLinks: document.getElementById('social-links'),
  footerSocialLinks: document.getElementById('footer-social-links'),
  footerName: document.getElementById('footer-name'),
  year: document.getElementById('year'),
};

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

const auth0ClientPromise = createAuth0ClientInstance();

let cvContent = loadCachedContent() || structuredClone(defaultContent);

render(cvContent);
populateForm(cvContent);
initReveal();
bindAdminActions();
void bootstrap();

async function bootstrap() {
  cvContent = await loadContent();
  render(cvContent);
  populateForm(cvContent);
  await initializeAuthFlow();
}

async function fetchRemoteContent() {
  const response = await fetch(API_ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Failed to load content from API');
  }

  return normalizeContent(await response.json());
}

async function loadContent() {
  try {
    const remoteContent = await fetchRemoteContent();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteContent));
    return remoteContent;
  } catch (error) {
    return loadCachedContent() || structuredClone(defaultContent);
  }
}

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

  refs.skillsList.innerHTML = '';
  content.skills.forEach((skill) => {
    const span = document.createElement('span');
    span.className = 'skill-item';
    span.textContent = skill;
    refs.skillsList.appendChild(span);
  });

  initReveal();
}

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

async function readErrorResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    return { error: 'Respuesta invalida del servidor' };
  }
}

function openAdminPanel() {
  admin.panel.classList.add('open');
  admin.panel.setAttribute('aria-hidden', 'false');
}

function closeAdminPanel() {
  admin.panel.classList.remove('open');
  admin.panel.setAttribute('aria-hidden', 'true');
}

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

function closeAuthModal() {
  admin.authModal.classList.remove('open');
  admin.authModal.setAttribute('aria-hidden', 'true');
}

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

function isAuthConfigured() {
  return (
    AUTH0_CONFIG.domain &&
    AUTH0_CONFIG.domain !== 'REEMPLAZAR_TU_DOMINIO.auth0.com' &&
    AUTH0_CONFIG.clientId &&
    AUTH0_CONFIG.clientId !== 'REEMPLAZAR_CLIENT_ID'
  );
}

async function getAuth0Client() {
  return auth0ClientPromise;
}

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

function createSocialLink(label, url) {
  const anchor = document.createElement('a');
  anchor.className = 'social-link';
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer noopener';
  anchor.textContent = label;
  return anchor;
}

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

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

// Claves de persistencia local y endpoint del CMS.
const STORAGE_KEY = 'cv-content-v1';
const API_ENDPOINT = '/api/content';
const GITHUB_STATS_CACHE_KEY = 'cv-github-stats-v1';
const LOCALE_KEY = 'cv-ui-locale-v1';
const TRANSLATION_CACHE_KEY = 'cv-translation-cache-v1';
const SUPPORTED_LOCALES = ['es', 'en'];

// Config runtime inyectada desde /api/config.
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

const UI_TEXT = {
  es: {
    title: 'CV Profesional | {name}',
    description: 'CV profesional online: experiencia, logros, proyectos y contacto.',
    nav: {
      profile: 'Perfil',
      experience: 'Experiencia',
      certifications: 'Certificaciones',
      projects: 'Proyectos',
      github: 'GitHub',
      contact: 'Contacto',
    },
    hero: {
      contact: 'Contactar',
      projects: 'Ver proyectos',
      downloadCV: 'Descargar CV',
      downloadATS: 'Descargar ATS',
    },
    panel: {
      contactInfo: 'Informacion de contacto',
    },
    facts: {
      location: 'Ubicacion',
      email: 'Email',
      phone: 'Telefono',
      languages: 'Idiomas',
    },
    section: {
      profileTag: 'Perfil profesional',
      about: 'Sobre mi',
      careerTag: 'Carrera',
      experience: 'Experiencia',
      trainingTag: 'Formacion validada',
      certifications: 'Certificaciones',
      workTag: 'Trabajo destacado',
      projects: 'Proyectos',
      githubTag: 'GitHub en vivo',
      github: 'Estadisticas y actividad',
      specialtiesTag: 'Especialidades',
      skills: 'Habilidades',
    },
    footer: {
      contact: 'Contacto',
    },
    empty: {
      certificationsTitle: 'Certificaciones en actualización',
      certificationsBody: 'Este bloque se actualiza dinamicamente desde el panel de administracion.',
    },
    certifications: {
      complete: 'Completo',
      inProgress: 'En progreso',
      progress: 'Progreso',
    },
    githubStats: {
      repos: 'Repos públicos',
      stars: 'Estrellas',
      followers: 'Seguidores',
      updated: 'Ultima actualización',
      featured: 'Repositorio destacado',
      loadingTitle: 'Cargando actividad de GitHub',
      loadingBody: 'La pagina consulta la API publica de GitHub para mostrar estadisticas y repositorios recientes.',
      noDataTitle: 'No se pudo cargar la actividad',
      noDataBody: 'Revisa la conexion a internet o el nombre de usuario configurado en api/config.js.',
    },
    admin: {
      editButton: 'Editar contenido',
      panelTitle: 'Panel de contenido',
      logoutButton: 'Cerrar sesion',
      closeButton: 'Cerrar',
      saveButton: 'Guardar',
      restoreButton: 'Restaurar',
      downloadButton: 'Descargar JSON',
      uploadLabel: 'Cargar JSON',
      authTitle: 'Acceso de administrador',
      authHelp: 'Inicia sesion con Auth0 para editar el contenido del CV.',
      loginButton: 'Ingresar con Auth0',
      cancelButton: 'Cancelar',
    },
  },
  en: {
    title: 'Professional CV | {name}',
    description: 'Professional online CV: experience, achievements, projects, and contact.',
    nav: {
      profile: 'Profile',
      experience: 'Experience',
      certifications: 'Certifications',
      projects: 'Projects',
      github: 'GitHub',
      contact: 'Contact',
    },
    hero: {
      contact: 'Contact me',
      projects: 'View projects',
      downloadCV: 'Download CV',
      downloadATS: 'Download ATS',
    },
    panel: {
      contactInfo: 'Contact information',
    },
    facts: {
      location: 'Location',
      email: 'Email',
      phone: 'Phone',
      languages: 'Languages',
    },
    section: {
      profileTag: 'Professional profile',
      about: 'About me',
      careerTag: 'Career',
      experience: 'Experience',
      trainingTag: 'Validated training',
      certifications: 'Certifications',
      workTag: 'Featured work',
      projects: 'Projects',
      githubTag: 'GitHub live',
      github: 'Statistics and activity',
      specialtiesTag: 'Specialties',
      skills: 'Skills',
    },
    footer: {
      contact: 'Contact',
    },
    empty: {
      certificationsTitle: 'Certifications in progress',
      certificationsBody: 'This section is updated dynamically from the administration panel.',
    },
    certifications: {
      complete: 'Complete',
      inProgress: 'In progress',
      progress: 'Progress',
    },
    githubStats: {
      repos: 'Public repos',
      stars: 'Stars',
      followers: 'Followers',
      updated: 'Last updated',
      featured: 'Featured repository',
      loadingTitle: 'Loading GitHub activity',
      loadingBody: 'This page queries the public GitHub API to show recent stats and repositories.',
      noDataTitle: 'Could not load activity',
      noDataBody: 'Check your internet connection or the username configured in api/config.js.',
    },
    admin: {
      editButton: 'Edit content',
      panelTitle: 'Content panel',
      logoutButton: 'Logout',
      closeButton: 'Close',
      saveButton: 'Save',
      restoreButton: 'Restore',
      downloadButton: 'Download JSON',
      uploadLabel: 'Load JSON',
      authTitle: 'Administrator access',
      authHelp: 'Log in with Auth0 to edit CV content.',
      loginButton: 'Login with Auth0',
      cancelButton: 'Cancel',
    },
  },
};

if (!defaultContent || !normalizeContent) {
  throw new Error('content-model.js must be loaded before script.js');
}

// Referencias a nodos de UI para renderizar contenido publico.
const refs = {
  html: document.documentElement,
  metaDescription: document.querySelector('meta[name="description"]'),
  localeButtons: Array.from(document.querySelectorAll('[data-locale]')),
  heroBadge: document.getElementById('hero-badge'),
  heroName: document.getElementById('hero-name'),
  heroRole: document.getElementById('hero-role'),
  heroSummary: document.getElementById('hero-summary'),
  factsList: document.getElementById('facts-list'),
  aboutText: document.getElementById('about-text'),
  experienceList: document.getElementById('experience-list'),
  certificationsList: document.getElementById('certifications-list'),
  projectList: document.getElementById('project-list'),
  githubStats: document.getElementById('github-stats'),
  skillsList: document.getElementById('skills-list'),
  contactMessage: document.getElementById('contact-message'),
  contactEmail: document.getElementById('contact-email'),
  socialLinks: document.getElementById('social-links'),
  footerSocialLinks: document.getElementById('footer-social-links'),
  footerName: document.getElementById('footer-name'),
  year: document.getElementById('year'),
  downloadCVNormalBtn: document.getElementById('download-cv-normal'),
  downloadCVATSBtn: document.getElementById('download-cv-ats'),
  pdfContainer: document.getElementById('pdf-container'),
};

let currentLocale = getInitialLocale();
let translationRunId = 0;

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
let translatedContent = structuredClone(cvContent);

// Render inicial inmediato para reducir tiempo a primer contenido.
applyStaticLocale(currentLocale, cvContent);
bindLocaleActions();
render(cvContent);
populateForm(cvContent);
initReveal();
bindAdminActions();
bindDownloadActions();
void bootstrap();

// Inicializacion asincronica: prioriza CMS remoto y luego auth/github.
async function bootstrap() {
  cvContent = await loadContent();
  applyStaticLocale(currentLocale, cvContent);
  render(cvContent);
  populateForm(cvContent);
  void loadAndRenderGithubStats();
  await initializeAuthFlow();
  
  // Traducir contenido si el idioma no es español
  void localizeRenderedContent(cvContent);
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

// Determina el idioma inicial segun preferencia guardada o navegador.
function getInitialLocale() {
  const savedLocale = String(localStorage.getItem(LOCALE_KEY) || '').trim().toLowerCase();
  if (SUPPORTED_LOCALES.includes(savedLocale)) {
    return savedLocale;
  }

  const browserLocale = String(navigator.language || navigator.languages?.[0] || 'es').toLowerCase();
  return browserLocale.startsWith('en') ? 'en' : 'es';
}

// Aplica textos estaticos de la interfaz segun el idioma activo.
function applyStaticLocale(locale, content) {
  const localeText = UI_TEXT[locale] || UI_TEXT.es;
  refs.html.setAttribute('lang', locale);
  syncLocaleSwitcher(locale);

  // Traducir todos los elementos con data-i18n
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const value = readLocaleValue(localeText, key);
    
    if (value !== undefined && typeof value === 'string') {
      element.textContent = value;
    }
  });

  if (refs.metaDescription) {
    refs.metaDescription.setAttribute('content', localeText.description);
  }

  document.title = localeText.title.replace('{name}', content?.name || '');
  localStorage.setItem(LOCALE_KEY, locale);
}

// Mantiene el estado visual del selector visible sincronizado.
function syncLocaleSwitcher(locale) {
  refs.localeButtons.forEach((button) => {
    const isActive = button.dataset.locale === locale;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

// Conecta los botones visibles del selector con el cambio de idioma.
function bindLocaleActions() {
  refs.localeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextLocale = button.dataset.locale;
      if (!SUPPORTED_LOCALES.includes(nextLocale) || nextLocale === currentLocale) {
        return;
      }

      currentLocale = nextLocale;
      applyStaticLocale(currentLocale, cvContent);
      render(cvContent);
      populateForm(cvContent);
      void loadAndRenderGithubStats();
    });
  });
}

// Lee una clave anidada del diccionario de textos.
function readLocaleValue(source, key) {
  if (!source || !key) return undefined;
  
  const parts = String(key || '').split('.');
  let current = source;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Traduce el contenido dinamico renderizado cuando el idioma es distinto de espanol.
async function localizeRenderedContent(content) {
  if (currentLocale === 'es') {
    return;
  }

  const runId = ++translationRunId;

  try {
    const translated = await translateContentForLocale(content, currentLocale);
    if (runId !== translationRunId) {
      return;
    }

    // Guardar contenido traducido para uso en descargas
    translatedContent = translated;

    refs.heroBadge.textContent = translated.badge;
    refs.heroRole.textContent = translated.role;
    refs.heroSummary.textContent = translated.summary;
    refs.aboutText.textContent = translated.about;
    refs.contactMessage.textContent = translated.contactMessage;

    const experienceCards = refs.experienceList.querySelectorAll('article');
    translated.experience.forEach((item, index) => {
      const card = experienceCards[index];
      if (!card) return;
      const meta = card.querySelector('.meta');
      const title = card.querySelector('h3');
      const body = card.querySelector('.body-text');
      if (meta) meta.textContent = item.period;
      if (title) title.textContent = item.title;
      if (body) body.textContent = item.description;
    });

    const certificationCards = refs.certificationsList.querySelectorAll('article');
    translated.certifications.forEach((item, index) => {
      const card = certificationCards[index];
      if (!card) return;
      const year = card.querySelector('.certification-year');
      const title = card.querySelector('h3');
      const body = card.querySelector('.certification-issuer');
      if (year) year.textContent = item.year;
      if (title) title.textContent = item.name;
      if (body) body.textContent = item.issuer;
    });

    const projectCards = refs.projectList.querySelectorAll('article');
    translated.projects.forEach((item, index) => {
      const card = projectCards[index];
      if (!card) return;
      const title = card.querySelector('h3');
      const body = card.querySelector('.body-text');
      const stack = card.querySelector('.stack');
      if (title) title.textContent = item.title;
      if (body) body.textContent = item.description;
      if (stack) stack.textContent = item.stack;
    });

    const skillItems = refs.skillsList.querySelectorAll('.skill-item');
    translated.skills.forEach((skill, index) => {
      const item = skillItems[index];
      if (item) item.textContent = skill;
    });
  } catch (error) {
    return;
  }
}

// Traduce los textos editables del CV con cache local y fallback transparente.
async function translateContentForLocale(content, locale) {
  if (locale === 'es') {
    return content;
  }

  const translated = structuredClone(content);
  translated.badge = await translateText(content.badge, locale);
  translated.role = await translateText(content.role, locale);
  translated.summary = await translateText(content.summary, locale);
  translated.about = await translateText(content.about, locale);
  translated.contactMessage = await translateText(content.contactMessage, locale);

  translated.experience = await Promise.all(
    content.experience.map(async (item) => ({
      period: await translateText(item.period, locale),
      title: await translateText(item.title, locale),
      description: await translateText(item.description, locale),
    }))
  );

  translated.certifications = await Promise.all(
    content.certifications.map(async (item) => ({
      name: await translateText(item.name, locale),
      issuer: await translateText(item.issuer, locale),
      year: item.year,
      percentage: item.percentage,
    }))
  );

  translated.projects = await Promise.all(
    content.projects.map(async (item) => ({
      title: await translateText(item.title, locale),
      description: await translateText(item.description, locale),
      stack: await translateText(item.stack, locale),
    }))
  );

  translated.skills = await Promise.all(
    content.skills.map((skill) => translateText(skill, locale))
  );

  return translated;
}

// Traduce una cadena con cache persistente y servicio publico de Google Translate.
async function translateText(text, locale) {
  const sourceText = String(text || '').trim();
  if (!sourceText || locale === 'es') {
    return sourceText;
  }

  const cacheKey = `${locale}::${sourceText}`;
  const cached = readTranslationCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${encodeURIComponent(locale)}&dt=t&q=${encodeURIComponent(sourceText)}`
    );

    if (!response.ok) {
      throw new Error('Translation request failed');
    }

    const data = await response.json();
    const translated = Array.isArray(data)
      ? data[0].map((segment) => segment[0]).join('')
      : sourceText;

    writeTranslationCache(cacheKey, translated);
    return translated;
  } catch (error) {
    return sourceText;
  }
}

// Cache simple para traducciones repetidas.
function readTranslationCache(key) {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (!raw) {
      return '';
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed[key] === 'string' ? parsed[key] : '';
  } catch (error) {
    return '';
  }
}

// Guarda traducciones para evitar repetir llamadas externas.
function writeTranslationCache(key, value) {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = value;
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(parsed));
  } catch (error) {
    return;
  }
}

// Normaliza porcentaje para las barras de habilidad.
function clampPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

// Renderiza todas las secciones visibles del sitio a partir del modelo de contenido.
function render(content) {
  const localeText = UI_TEXT[currentLocale] || UI_TEXT.es;
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
  document.title = localeText.title.replace('{name}', content.name);
  if (refs.metaDescription) {
    refs.metaDescription.setAttribute('content', localeText.description);
  }

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
  const personalFacts = [
    { label: localeText.facts.location, value: content.location, href: '' },
    { label: localeText.facts.email, value: content.email, href: `mailto:${content.email}` },
    { label: localeText.facts.phone, value: formatPhoneDisplay(content.phone), href: buildPhoneHref(content.phone) },
    { label: localeText.facts.languages, value: content.languages, href: '' },
  ];

  personalFacts.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'fact-item';

    const term = document.createElement('dt');
    term.className = 'fact-label';
    term.textContent = item.label;

    const description = document.createElement('dd');
    description.className = 'fact-value';

    if (item.href) {
      const link = document.createElement('a');
      link.className = 'fact-link';
      link.href = item.href;
      link.textContent = item.value;
      if (item.href.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noreferrer noopener';
      }
      description.appendChild(link);
    } else {
      description.textContent = item.value;
    }

    row.appendChild(term);
    row.appendChild(description);
    refs.factsList.appendChild(row);
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

  refs.certificationsList.innerHTML = '';
  if (!content.certifications.length) {
    const emptyCard = document.createElement('article');
    emptyCard.className = 'card certification-card reveal';
    emptyCard.innerHTML = `
      <h3>${escapeHTML(localeText.empty.certificationsTitle)}</h3>
      <p class="body-text certification-issuer">${escapeHTML(localeText.empty.certificationsBody)}</p>
    `;
    refs.certificationsList.appendChild(emptyCard);
  }

  content.certifications.forEach((item) => {
    const percentage = clampPercentage(item.percentage ?? 100);
    const isComplete = percentage >= 100;
    const certificationText = UI_TEXT[currentLocale] || UI_TEXT.es;
    const article = document.createElement('article');
    article.className = 'card certification-card reveal';
    article.innerHTML = `
      <div class="certification-head">
        <div>
          <div class="certification-year">${escapeHTML(item.year)}</div>
          <h3>${escapeHTML(item.name)}</h3>
        </div>
        <span class="certification-percent">${percentage}%</span>
      </div>
      <div class="certification-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}" aria-label="${escapeHTML(item.name)} ${percentage}%">
        <span class="certification-fill ${isComplete ? 'is-complete' : ''}" style="width: ${percentage}%"></span>
      </div>
      <div class="certification-foot">
        <span class="certification-status ${isComplete ? 'is-complete' : 'is-progress'}">${escapeHTML(isComplete ? certificationText.certifications.complete : certificationText.certifications.inProgress)}</span>
        <span class="certification-progress-label">${escapeHTML(certificationText.certifications.progress)}</span>
      </div>
      <p class="body-text certification-issuer">${escapeHTML(item.issuer)}</p>
    `;
    refs.certificationsList.appendChild(article);
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
  void localizeRenderedContent(content);
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
  admin.form.elements.certifications.value = content.certifications
    .map((item) => `${item.name} | ${item.issuer} | ${item.year} | ${item.percentage ?? 100}`)
    .join('\n');
  admin.form.elements.experience.value = content.experience
    .map((item) => `${item.period} | ${item.title} | ${item.description}`)
    .join('\n');
  admin.form.elements.projects.value = content.projects
    .map((item) => `${item.title} | ${item.description} | ${item.stack}`)
    .join('\n');
}

// Genera HTML para CV en formato visual con estilos
function generateStyledCVHTML(content, labels = {}) {
  const defaultLabels = {
    aboutTitle: 'Sobre mí',
    experienceTitle: 'Experiencia',
    certificationsTitle: 'Certificaciones',
    projectsTitle: 'Proyectos',
    skillsTitle: 'Habilidades',
    contactTitle: 'Contacto',
    location: 'Ubicación',
    email: 'Email',
    phone: 'Teléfono',
    languages: 'Idiomas',
    stackLabel: 'Stack',
  };
  const finalLabels = { ...defaultLabels, ...labels };
  const skills = content.skills.join(', ');
  const certificationsHTML = content.certifications
    .map((cert) => `<article class="pdf-item avoid-break"><strong>${escapeHTML(cert.name)}</strong><span>${escapeHTML(cert.issuer)} · ${escapeHTML(cert.year)}</span></article>`)
    .join('');
  const experienceHTML = content.experience
    .map((exp) => `<article class="pdf-item avoid-break"><strong>${escapeHTML(exp.title)}</strong><span>${escapeHTML(exp.period)}</span><p>${escapeHTML(exp.description)}</p></article>`)
    .join('');
  const projectsHTML = content.projects
    .map((proj) => `<article class="pdf-item avoid-break"><strong>${escapeHTML(proj.title)}</strong><span>${finalLabels.stackLabel}: ${escapeHTML(proj.stack)}</span><p>${escapeHTML(proj.description)}</p></article>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - CV</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#243042;background:#fff;font-size:10.5px;line-height:1.28;padding:12mm 10mm 10mm}.page{max-width:100%;margin:0 auto}.header{display:grid;grid-template-columns:1.4fr 1fr;gap:8px 16px;align-items:start;padding-bottom:8px;border-bottom:1px solid #d5deea;margin-bottom:10px;page-break-inside:avoid}h1{font-size:20px;line-height:1.05;margin:0 0 4px;font-family:Arial,sans-serif}.role{font-size:11px;font-weight:700;color:#1067d8;margin:0 0 6px}.badge{display:inline-block;background:#e8f0fe;color:#1067d8;border-radius:999px;padding:3px 8px;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px}.summary{margin:0;color:#516178;max-width:62ch}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px;font-size:9.5px;color:#516178}.contact-chip{display:flex;gap:4px;min-width:0}.contact-chip strong{color:#243042;white-space:nowrap}.main-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:8px 14px;align-items:start}.section{background:#fff;border:1px solid #dfe7f1;border-radius:10px;padding:8px 9px;margin:0 0 8px;page-break-inside:avoid}.section h2{font-size:11px;line-height:1.1;margin:0 0 6px;padding:0 0 5px;border-bottom:1px solid #dfe7f1;text-transform:uppercase;letter-spacing:.04em;color:#1067d8;page-break-after:avoid}.section p{margin:0}.section .muted{color:#516178}.stack-inline{color:#516178;font-size:9.5px}.skill-list{display:flex;flex-wrap:wrap;gap:4px}.skill-pill{border:1px solid #dfe7f1;border-radius:999px;padding:3px 7px;font-size:9px;line-height:1.1;background:#f8fbff;color:#243042}.pdf-list{display:grid;gap:6px}.pdf-item{display:grid;gap:1px;padding-bottom:6px;border-bottom:1px dashed #e2e8f2}.pdf-item:last-child{padding-bottom:0;border-bottom:0}.pdf-item strong{font-size:10px;color:#243042}.pdf-item span,.pdf-item p{font-size:9.3px;color:#516178}.pdf-item p{line-height:1.22}.avoid-break{break-inside:avoid;page-break-inside:avoid}.compact-contact p{margin:0}.compact-links a{color:#1067d8;text-decoration:none}@media print{body{padding:7mm 7mm 6mm}.section,.header,.avoid-break{break-inside:avoid;page-break-inside:avoid}.page{page-break-after:avoid}}</style></head><body><div class="page"><div class="header avoid-break"><div><div class="badge">${escapeHTML(content.badge)}</div><h1>${escapeHTML(content.name)}</h1><p class="role">${escapeHTML(content.role)}</p><p class="summary">${escapeHTML(content.summary)}</p></div><div class="compact-contact contact-grid"><div class="contact-chip"><strong>${finalLabels.location}:</strong><span>${escapeHTML(content.location)}</span></div><div class="contact-chip"><strong>${finalLabels.email}:</strong><span><a href="mailto:${escapeHTML(content.email)}">${escapeHTML(content.email)}</a></span></div><div class="contact-chip"><strong>${finalLabels.phone}:</strong><span>${escapeHTML(content.phone)}</span></div><div class="contact-chip"><strong>${finalLabels.languages}:</strong><span>${escapeHTML(content.languages)}</span></div></div></div><div class="main-grid"><div><section class="section avoid-break"><h2>${finalLabels.aboutTitle}</h2><p>${escapeHTML(content.about)}</p></section><section class="section avoid-break"><h2>${finalLabels.skillsTitle}</h2><div class="skill-list">${content.skills.map((skill) => `<span class="skill-pill">${escapeHTML(skill)}</span>`).join('')}</div></section><section class="section avoid-break"><h2>${finalLabels.contactTitle}</h2><p>${escapeHTML(content.contactMessage)}</p><p class="compact-links">${content.social.linkedin ? `<a href="${escapeHTML(content.social.linkedin)}" target="_blank" rel="noreferrer noopener">LinkedIn</a> · ` : ''}${content.social.github ? `<a href="${escapeHTML(content.social.github)}" target="_blank" rel="noreferrer noopener">GitHub</a> · ` : ''}${content.social.portfolio ? `<a href="${escapeHTML(content.social.portfolio)}" target="_blank" rel="noreferrer noopener">Portfolio</a>` : ''}</p></section></div><div><section class="section avoid-break"><h2>${finalLabels.experienceTitle}</h2><div class="pdf-list">${experienceHTML}</div></section><section class="section avoid-break"><h2>${finalLabels.certificationsTitle}</h2><div class="pdf-list">${certificationsHTML}</div></section><section class="section avoid-break"><h2>${finalLabels.projectsTitle}</h2><div class="pdf-list">${projectsHTML}</div></section></div></div></div></body></html>`;
}

function generateATSCVHTML(content, labels = {}) {
  const defaultLabels = {
    contactInfo: 'CONTACT INFORMATION', location: 'Location', email: 'Email', phone: 'Phone',
    languages: 'Languages', summary: 'SUMMARY', about: 'ABOUT', experience: 'EXPERIENCE',
    certifications: 'CERTIFICATIONS', projects: 'PROJECTS', skills: 'SKILLS',
    contactMessage: 'CONTACT MESSAGE', socialProfiles: 'SOCIAL PROFILES', stackLabel: 'Stack',
  };
  const finalLabels = { ...defaultLabels, ...labels };
  const skills = content.skills.join(', ');
  const certifications = content.certifications.map((cert) => `${cert.name} - ${cert.issuer} (${cert.year})`).join('\n');
  const experience = content.experience.map((exp) => `${exp.title} (${exp.period})\n${exp.description}`).join('\n\n');
  const projects = content.projects.map((proj) => `${proj.title}\n${proj.description}\n${finalLabels.stackLabel}: ${proj.stack}`).join('\n\n');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - CV ATS</title><style>html,body{margin:0;padding:0}body{font-family:'Courier New',monospace;white-space:pre-wrap;word-wrap:break-word;font-size:9.5px;line-height:1.22;color:#111;padding:8mm 9mm}h1,h2,p{margin:0}h1{font-size:16px;line-height:1.05;margin-bottom:2px}h2{font-size:10px;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.04em}section{page-break-inside:avoid;margin-bottom:4px} .block{page-break-inside:avoid} .spacer{height:4px} .label{font-weight:700}</style></head><body><h1>${escapeHTML(content.name)}</h1><div class="block">${escapeHTML(content.role)} | ${escapeHTML(content.badge)}</div><div class="spacer"></div><section><h2>${finalLabels.contactInfo}</h2><div class="block"><span class="label">${finalLabels.location}:</span> ${escapeHTML(content.location)} | <span class="label">${finalLabels.email}:</span> ${escapeHTML(content.email)} | <span class="label">${finalLabels.phone}:</span> ${escapeHTML(content.phone)} | <span class="label">${finalLabels.languages}:</span> ${escapeHTML(content.languages)}</div></section><section><h2>${finalLabels.summary}</h2><div class="block">${escapeHTML(content.summary)}</div></section><section><h2>${finalLabels.about}</h2><div class="block">${escapeHTML(content.about)}</div></section><section><h2>${finalLabels.experience}</h2><div class="block">${experience}</div></section><section><h2>${finalLabels.certifications}</h2><div class="block">${certifications}</div></section><section><h2>${finalLabels.projects}</h2><div class="block">${projects}</div></section><section><h2>${finalLabels.skills}</h2><div class="block">${skills}</div></section><section><h2>${finalLabels.contactMessage}</h2><div class="block">${escapeHTML(content.contactMessage)}</div></section><section><h2>${finalLabels.socialProfiles}</h2><div class="block">LinkedIn: ${content.social.linkedin || 'N/A'} | GitHub: ${content.social.github || 'N/A'} | Portfolio: ${content.social.portfolio || 'N/A'}</div></section></body></html>`;
}

async function downloadCVPDF(format) {
  const content = currentLocale !== 'es' ? translatedContent : cvContent;
  const pdfLabels = currentLocale === 'es' ? {aboutTitle:'Sobre mí',experienceTitle:'Experiencia',certificationsTitle:'Certificaciones',projectsTitle:'Proyectos',skillsTitle:'Habilidades',contactTitle:'Contacto',location:'Ubicación',email:'Email',phone:'Teléfono',languages:'Idiomas',stackLabel:'Stack',contactInfo:'CONTACT INFORMATION',summary:'SUMMARY',about:'ABOUT',experience:'EXPERIENCE',certifications:'CERTIFICATIONS',projects:'PROJECTS',skills:'SKILLS',contactMessage:'CONTACT MESSAGE',socialProfiles:'SOCIAL PROFILES'} : {aboutTitle:'About me',experienceTitle:'Experience',certificationsTitle:'Certifications',projectsTitle:'Projects',skillsTitle:'Skills',contactTitle:'Contact',location:'Location',email:'Email',phone:'Phone',languages:'Languages',stackLabel:'Stack',contactInfo:'CONTACT INFORMATION',summary:'SUMMARY',about:'ABOUT',experience:'EXPERIENCE',certifications:'CERTIFICATIONS',projects:'PROJECTS',skills:'SKILLS',contactMessage:'CONTACT MESSAGE',socialProfiles:'SOCIAL PROFILES'};
  const html = format === 'ats' ? generateATSCVHTML(content, pdfLabels) : generateStyledCVHTML(content, pdfLabels);
  
  const element = document.createElement('div');
  element.innerHTML = html;
  refs.pdfContainer.appendChild(element);

  try {
    const localeSuffix = currentLocale === 'en' ? 'EN' : 'ES';
    const filename = format === 'ats' 
      ? `${content.name.replace(/\s+/g, '_')}_CV_ATS_${localeSuffix}.pdf`
      : `${content.name.replace(/\s+/g, '_')}_CV_${localeSuffix}.pdf`;

    const opt = {
      margin: [6, 6, 6, 6],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.6, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-break', '.section'] },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Could not download CV. Please try again.');
  } finally {
    refs.pdfContainer.removeChild(element);
  }
}

// Conecta listeners para botones de descarga de CV
function bindDownloadActions() {
  if (refs.downloadCVNormalBtn) {
    refs.downloadCVNormalBtn.addEventListener('click', () => {
      downloadCVPDF('normal');
    });
  }

  if (refs.downloadCVATSBtn) {
    refs.downloadCVATSBtn.addEventListener('click', () => {
      downloadCVPDF('ats');
    });
  }
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
    alert('Revisa el formato de Certificaciones, Experiencia y Proyectos. Usa: campo | campo | campo');
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

  const certifications = parsePipeLines(form.certifications.value, ['name', 'issuer', 'year', 'percentage']);
  const experience = parsePipeLines(form.experience.value, ['period', 'title', 'description']);
  const projects = parsePipeLines(form.projects.value, ['title', 'description', 'stack']);

  if (!certifications || !experience || !projects) {
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
    certifications,
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
  const localeText = UI_TEXT[currentLocale] || UI_TEXT.es;

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
      <span class="github-pill">${currentLocale === 'en' ? 'Auto-refresh from GitHub' : 'Auto-refresh desde GitHub'}</span>
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
    refs.githubStats.appendChild(createStatCard('GitHub', currentLocale === 'en' ? 'Configure username' : 'Configurar usuario'));
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
  const localeText = UI_TEXT[currentLocale] || UI_TEXT.es;

  if (!stats) {
    refs.githubStats.appendChild(createStatCard('GitHub', error ? (currentLocale === 'en' ? 'Unavailable' : 'No disponible') : (currentLocale === 'en' ? 'No data' : 'Sin datos')));
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

// Convierte telefono libre en href tel compatible con moviles.
function buildPhoneHref(phone) {
  const sanitized = String(phone || '').replace(/[^\d+]/g, '');
  return sanitized ? `tel:${sanitized}` : '';
}

// Mantiene visual del telefono mientras se sanitiza el enlace.
function formatPhoneDisplay(phone) {
  return String(phone || '').trim();
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

import {
  readLocaleValue as utilReadLocaleValue,
  clampPercentage as utilClampPercentage,
  formatRelativeDate as utilFormatRelativeDate,
  parsePipeLines as utilParsePipeLines,
  buildPhoneHref as utilBuildPhoneHref,
  formatPhoneDisplay as utilFormatPhoneDisplay,
  escapeHTML as utilEscapeHTML,
  normalizeAuth0Domain as utilNormalizeAuth0Domain,
} from './frontend/utils.js';
import {
  normalizeText as atsNormalizeText,
  buildAnalysis as atsBuildAnalysis,
} from './frontend/ats-engine.js';
import { create as createAtsPanel } from './frontend/ats-panel.js';
import { create as createRenderModule } from './frontend/render-module.js';
import { create as createGithubModule } from './frontend/github-module.js';
import { create as createAuthModule } from './frontend/auth-module.js';

// Claves de persistencia local y endpoint del CMS.
const STORAGE_KEY = 'cv-content-v1';
const API_ENDPOINT = '/api/content';
const GITHUB_STATS_CACHE_KEY = 'cv-github-stats-v2';
const LOCALE_KEY = 'cv-ui-locale-v1';
const TRANSLATION_CACHE_KEY = 'cv-translation-cache-v1';
const ATS_JOB_DESCRIPTION_KEY = 'cv-ats-job-description-v1';
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

let authApi = null;

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
      downloadATS: 'Descargar ATS (TXT)',
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
      repos: 'Repos visibles',
      privateRepos: 'Repos privados',
      stars: 'Estrellas',
      followers: 'Seguidores',
      updated: 'Ultima actividad',
      featured: 'Repositorio destacado',
      latestCommit: 'Ultimo commit',
      privateAccess: 'Incluye privados',
      loadingTitle: 'Cargando actividad de GitHub',
      loadingBody: 'La pagina consulta un endpoint autenticado de GitHub para mostrar repos publicos, privados y commits recientes.',
      noDataTitle: 'No se pudo cargar la actividad',
      noDataBody: 'Revisa la conexion, el token GITHUB_TOKEN o el nombre de usuario configurado en api/config.js.',
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
      atsTitle: 'Optimizador ATS',
      atsJobLabel: 'Pega la descripcion de la vacante (opcional)',
      atsJobPlaceholder: 'Requisitos, responsabilidades y tecnologias de la oferta',
      atsAnalyzeButton: 'Analizar match ATS',
      atsApplySummaryButton: 'Agregar keywords a skills',
      atsNoData: 'Pega una vacante para analizar keywords y score de match.',
      atsScore: 'Score estimado',
      atsLevel: 'Nivel',
      atsLevelLow: 'Bajo',
      atsLevelMedium: 'Medio',
      atsLevelHigh: 'Alto',
      atsMatched: 'Keywords detectadas',
      atsMissing: 'Keywords faltantes',
      atsSuggestions: 'Frases sugeridas',
      atsNoSuggestions: 'No hay sugerencias disponibles para aplicar.',
      atsSummaryApplied: 'Se agregaron keywords sugeridas al campo skills.',
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
      downloadATS: 'Download ATS (TXT)',
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
      repos: 'Visible repos',
      privateRepos: 'Private repos',
      stars: 'Stars',
      followers: 'Followers',
      updated: 'Latest activity',
      featured: 'Featured repository',
      latestCommit: 'Latest commit',
      privateAccess: 'Includes private repos',
      loadingTitle: 'Loading GitHub activity',
      loadingBody: 'This page queries an authenticated GitHub endpoint to show public repos, private repos, and recent commits.',
      noDataTitle: 'Could not load activity',
      noDataBody: 'Check your connection, the GITHUB_TOKEN, or the username configured in api/config.js.',
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
      atsTitle: 'ATS Optimizer',
      atsJobLabel: 'Paste the job description (optional)',
      atsJobPlaceholder: 'Requirements, responsibilities, and technologies from the job post',
      atsAnalyzeButton: 'Analyze ATS match',
      atsApplySummaryButton: 'Add keywords to skills',
      atsNoData: 'Paste a job post to analyze keywords and match score.',
      atsScore: 'Estimated score',
      atsLevel: 'Level',
      atsLevelLow: 'Low',
      atsLevelMedium: 'Medium',
      atsLevelHigh: 'High',
      atsMatched: 'Matched keywords',
      atsMissing: 'Missing keywords',
      atsSuggestions: 'Suggested phrases',
      atsNoSuggestions: 'No suggestions available to apply.',
      atsSummaryApplied: 'Suggested keywords were added to the skills field.',
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
  projectAnchors: Array.from(document.querySelectorAll('a[href="#proyectos"]')),
  heroBadge: document.getElementById('hero-badge'),
  heroName: document.getElementById('hero-name'),
  heroRole: document.getElementById('hero-role'),
  heroSummary: document.getElementById('hero-summary'),
  factsList: document.getElementById('facts-list'),
  aboutText: document.getElementById('about-text'),
  experienceList: document.getElementById('experience-list'),
  certificationsList: document.getElementById('certifications-list'),
  projectsSection: document.getElementById('proyectos'),
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
  atsJobDescription: document.getElementById('ats-job-description'),
  atsAnalyzeBtn: document.getElementById('analyze-ats'),
  atsApplySummaryBtn: document.getElementById('apply-ats-summary'),
  atsAnalysisResult: document.getElementById('ats-analysis-result'),
};

const atsPanelApi = createAtsPanel({
  admin,
  storageKey: ATS_JOB_DESCRIPTION_KEY,
  getCurrentLocale: () => currentLocale,
  getLocaleText: () => UI_TEXT[currentLocale] || UI_TEXT.es,
  getContent: () => cvContent,
  buildAnalysis: (jobDescription, content) => buildATSAnalysis(jobDescription, content),
  escapeHTML: (value) => escapeHTML(value),
  normalizeText: (value) => normalizeAtsText(value),
});

const githubApi = createGithubModule({
  refs,
  getLocaleText: () => UI_TEXT[currentLocale] || UI_TEXT.es,
  getCurrentLocale: () => currentLocale,
  getGithubUsername: () => GITHUB_USERNAME,
  getCacheMinutes: () => GITHUB_STATS_CACHE_MINUTES,
  cacheKey: GITHUB_STATS_CACHE_KEY,
  escapeHTML: (value) => escapeHTML(value),
  formatRelativeDate: (isoDate) => formatRelativeDate(isoDate),
});

const renderApi = createRenderModule({
  refs,
  admin,
  getLocaleText: () => UI_TEXT[currentLocale] || UI_TEXT.es,
  getCurrentLocale: () => currentLocale,
  clampPercentage: (value) => clampPercentage(value),
  escapeHTML: (value) => escapeHTML(value),
  buildPhoneHref: (phone) => buildPhoneHref(phone),
  formatPhoneDisplay: (phone) => formatPhoneDisplay(phone),
  initReveal: () => initReveal(),
  localizeRenderedContent: (content) => localizeRenderedContent(content),
  refreshATSAnalysisPreview: () => refreshATSAnalysisPreview(),
  ensureGithubSkeleton: () => {
    if (refs.githubStats && refs.githubStats.children.length === 0) {
      githubApi.renderSkeleton();
    }
  },
});

authApi = createAuthModule({
  admin,
  auth0Config: AUTH0_CONFIG,
  auth0RedirectUri: AUTH0_REDIRECT_URI,
  auth0Scope: AUTH0_SCOPE,
  auth0Connection: AUTH0_CONNECTION,
  authIntentKey: AUTH_INTENT_KEY,
  getAuthClientPromise: () => auth0ClientPromise,
  onOpenAdminPanel: () => {
    admin.panel.classList.add('open');
    admin.panel.setAttribute('aria-hidden', 'false');
  },
  onCloseAdminPanel: () => {
    admin.panel.classList.remove('open');
    admin.panel.setAttribute('aria-hidden', 'true');
  },
  onCloseAuthModal: () => {
    admin.authModal.classList.remove('open');
    admin.authModal.setAttribute('aria-hidden', 'true');
  },
  onOpenAuthModal: () => {
    admin.authModal.classList.add('open');
    admin.authModal.setAttribute('aria-hidden', 'false');
  },
});

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

  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    const value = readLocaleValue(localeText, key);

    if (value !== undefined && typeof value === 'string') {
      element.setAttribute('placeholder', value);
    }
  });

  if (refs.metaDescription) {
    refs.metaDescription.setAttribute('content', localeText.description);
  }

  document.title = localeText.title.replace('{name}', content?.name || '');
  localStorage.setItem(LOCALE_KEY, locale);
  refreshATSAnalysisPreview();
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
  return utilReadLocaleValue(source, key);
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
  return utilClampPercentage(value);
}

// Renderiza todas las secciones visibles del sitio a partir del modelo de contenido.
function render(content) {
  renderApi.render(content);
}

// Muestra/oculta la seccion y enlaces de proyectos cuando no hay contenido.
function updateProjectsVisibility(hasProjects) {
  renderApi.updateProjectsVisibility(hasProjects);
}

// Completa el formulario admin con el estado actual del contenido.
function populateForm(content) {
  renderApi.populateForm(content);
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
  const projectsSectionHTML = projectsHTML
    ? `<section class="section avoid-break"><h2>${finalLabels.projectsTitle}</h2><div class="pdf-list">${projectsHTML}</div></section>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - CV</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#243042;background:#fff;font-size:10.5px;line-height:1.28;padding:12mm 10mm 10mm}.page{max-width:100%;margin:0 auto}.header{display:grid;grid-template-columns:1.4fr 1fr;gap:8px 16px;align-items:start;padding-bottom:8px;border-bottom:1px solid #d5deea;margin-bottom:10px;page-break-inside:avoid}h1{font-size:20px;line-height:1.05;margin:0 0 4px;font-family:Arial,sans-serif}.role{font-size:11px;font-weight:700;color:#1067d8;margin:0 0 6px}.badge{display:inline-block;background:#e8f0fe;color:#1067d8;border-radius:999px;padding:3px 8px;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px}.summary{margin:0;color:#516178;max-width:62ch}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px;font-size:9.5px;color:#516178}.contact-chip{display:flex;gap:4px;min-width:0}.contact-chip strong{color:#243042;white-space:nowrap}.main-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:8px 14px;align-items:start}.section{background:#fff;border:1px solid #dfe7f1;border-radius:10px;padding:8px 9px;margin:0 0 8px;page-break-inside:avoid}.section h2{font-size:11px;line-height:1.1;margin:0 0 6px;padding:0 0 5px;border-bottom:1px solid #dfe7f1;text-transform:uppercase;letter-spacing:.04em;color:#1067d8;page-break-after:avoid}.section p{margin:0}.section .muted{color:#516178}.stack-inline{color:#516178;font-size:9.5px}.skill-list{display:flex;flex-wrap:wrap;gap:4px}.skill-pill{border:1px solid #dfe7f1;border-radius:999px;padding:3px 7px;font-size:9px;line-height:1.1;background:#f8fbff;color:#243042}.pdf-list{display:grid;gap:6px}.pdf-item{display:grid;gap:1px;padding-bottom:6px;border-bottom:1px dashed #e2e8f2}.pdf-item:last-child{padding-bottom:0;border-bottom:0}.pdf-item strong{font-size:10px;color:#243042}.pdf-item span,.pdf-item p{font-size:9.3px;color:#516178}.pdf-item p{line-height:1.22}.avoid-break{break-inside:avoid;page-break-inside:avoid}.compact-contact p{margin:0}.compact-links a{color:#1067d8;text-decoration:none}@media print{body{padding:7mm 7mm 6mm}.section,.header,.avoid-break{break-inside:avoid;page-break-inside:avoid}.page{page-break-after:avoid}}</style></head><body><div class="page"><div class="header avoid-break"><div><div class="badge">${escapeHTML(content.badge)}</div><h1>${escapeHTML(content.name)}</h1><p class="role">${escapeHTML(content.role)}</p><p class="summary">${escapeHTML(content.summary)}</p></div><div class="compact-contact contact-grid"><div class="contact-chip"><strong>${finalLabels.location}:</strong><span>${escapeHTML(content.location)}</span></div><div class="contact-chip"><strong>${finalLabels.email}:</strong><span><a href="mailto:${escapeHTML(content.email)}">${escapeHTML(content.email)}</a></span></div><div class="contact-chip"><strong>${finalLabels.phone}:</strong><span>${escapeHTML(content.phone)}</span></div><div class="contact-chip"><strong>${finalLabels.languages}:</strong><span>${escapeHTML(content.languages)}</span></div></div></div><div class="main-grid"><div><section class="section avoid-break"><h2>${finalLabels.aboutTitle}</h2><p>${escapeHTML(content.about)}</p></section><section class="section avoid-break"><h2>${finalLabels.skillsTitle}</h2><div class="skill-list">${content.skills.map((skill) => `<span class="skill-pill">${escapeHTML(skill)}</span>`).join('')}</div></section><section class="section avoid-break"><h2>${finalLabels.contactTitle}</h2><p>${escapeHTML(content.contactMessage)}</p><p class="compact-links">${content.social.linkedin ? `<a href="${escapeHTML(content.social.linkedin)}" target="_blank" rel="noreferrer noopener">LinkedIn</a> · ` : ''}${content.social.github ? `<a href="${escapeHTML(content.social.github)}" target="_blank" rel="noreferrer noopener">GitHub</a> · ` : ''}${content.social.portfolio ? `<a href="${escapeHTML(content.social.portfolio)}" target="_blank" rel="noreferrer noopener">Portfolio</a>` : ''}</p></section></div><div><section class="section avoid-break"><h2>${finalLabels.experienceTitle}</h2><div class="pdf-list">${experienceHTML}</div></section><section class="section avoid-break"><h2>${finalLabels.certificationsTitle}</h2><div class="pdf-list">${certificationsHTML}</div></section>${projectsSectionHTML}</div></div></div></body></html>`;
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
  const projectsSectionHTML = projects
    ? `<section><h2>${finalLabels.projects}</h2><div class="block">${projects}</div></section>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - CV ATS</title><style>html,body{margin:0;padding:0}body{font-family:'Courier New',monospace;white-space:pre-wrap;word-wrap:break-word;font-size:9.5px;line-height:1.22;color:#111;padding:8mm 9mm}h1,h2,p{margin:0}h1{font-size:16px;line-height:1.05;margin-bottom:2px}h2{font-size:10px;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.04em}section{page-break-inside:avoid;margin-bottom:4px} .block{page-break-inside:avoid} .spacer{height:4px} .label{font-weight:700}</style></head><body><h1>${escapeHTML(content.name)}</h1><div class="block">${escapeHTML(content.role)} | ${escapeHTML(content.badge)}</div><div class="spacer"></div><section><h2>${finalLabels.contactInfo}</h2><div class="block"><span class="label">${finalLabels.location}:</span> ${escapeHTML(content.location)} | <span class="label">${finalLabels.email}:</span> ${escapeHTML(content.email)} | <span class="label">${finalLabels.phone}:</span> ${escapeHTML(content.phone)} | <span class="label">${finalLabels.languages}:</span> ${escapeHTML(content.languages)}</div></section><section><h2>${finalLabels.summary}</h2><div class="block">${escapeHTML(content.summary)}</div></section><section><h2>${finalLabels.about}</h2><div class="block">${escapeHTML(content.about)}</div></section><section><h2>${finalLabels.experience}</h2><div class="block">${experience}</div></section><section><h2>${finalLabels.certifications}</h2><div class="block">${certifications}</div></section>${projectsSectionHTML}<section><h2>${finalLabels.skills}</h2><div class="block">${skills}</div></section><section><h2>${finalLabels.contactMessage}</h2><div class="block">${escapeHTML(content.contactMessage)}</div></section><section><h2>${finalLabels.socialProfiles}</h2><div class="block">LinkedIn: ${content.social.linkedin || 'N/A'} | GitHub: ${content.social.github || 'N/A'} | Portfolio: ${content.social.portfolio || 'N/A'}</div></section></body></html>`;
}

// Genera una version ATS en texto plano para mejorar parseo en filtros automaticos.
function generateATSCVText(content, labels = {}) {
  const defaultLabels = {
    summary: 'SUMMARY',
    skills: 'SKILLS',
    experience: 'EXPERIENCE',
    certifications: 'CERTIFICATIONS',
    projects: 'PROJECTS',
    contactMessage: 'CONTACT MESSAGE',
    socialProfiles: 'SOCIAL PROFILES',
    location: 'Location',
    email: 'Email',
    phone: 'Phone',
    languages: 'Languages',
  };

  const finalLabels = { ...defaultLabels, ...labels };
  const keywordSet = new Set();
  content.skills.forEach((skill) => keywordSet.add(String(skill || '').trim()));
  content.projects.forEach((project) => {
    String(project.stack || '')
      .split(/[;,/]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => keywordSet.add(part));
  });

  const keywords = Array.from(keywordSet).filter(Boolean).join(', ');
  const experienceText = content.experience
    .map((item) => `- ${item.title} (${item.period})\n  ${item.description}`)
    .join('\n\n');
  const certificationsText = content.certifications.length
    ? content.certifications.map((item) => `- ${item.name} - ${item.issuer} (${item.year})`).join('\n')
    : '- N/A';
  const projectsText = content.projects.length
    ? content.projects.map((item) => `- ${item.title}\n  ${item.description}\n  Stack: ${item.stack}`).join('\n\n')
    : '';

  return [
    content.name,
    content.role,
    '',
    `${finalLabels.location}: ${content.location}`,
    `${finalLabels.email}: ${content.email}`,
    `${finalLabels.phone}: ${content.phone}`,
    `${finalLabels.languages}: ${content.languages}`,
    '',
    finalLabels.summary,
    content.summary,
    '',
    finalLabels.skills,
    content.skills.join(', '),
    '',
    'KEYWORDS',
    keywords || 'N/A',
    '',
    finalLabels.experience,
    experienceText || '- N/A',
    '',
    finalLabels.certifications,
    certificationsText,
    '',
    ...(projectsText ? [finalLabels.projects, projectsText, ''] : []),
    finalLabels.contactMessage,
    content.contactMessage,
    '',
    finalLabels.socialProfiles,
    `LinkedIn: ${content.social.linkedin || 'N/A'}`,
    `GitHub: ${content.social.github || 'N/A'}`,
    `Portfolio: ${content.social.portfolio || 'N/A'}`,
  ].join('\n');
}

// Genera HTML ATS-friendly limpio y lineal sin estructuras complejas
function generateATSFriendlyHTML(content, labels = {}) {
  const defaultLabels = {
    summary: 'SUMMARY',
    skills: 'SKILLS',
    experience: 'EXPERIENCE',
    certifications: 'CERTIFICATIONS',
    projects: 'PROJECTS',
    contactMessage: 'CONTACT MESSAGE',
    socialProfiles: 'SOCIAL PROFILES',
    location: 'Location',
    email: 'Email',
    phone: 'Phone',
    languages: 'Languages',
  };

  const finalLabels = { ...defaultLabels, ...labels };
  
  // Construir secciones con formato simple y lineal
  const sections = [];
  
  // Encabezado
  sections.push(`<h1 style="margin:0 0 4px 0; font-size:18px; font-weight:bold;">${escapeHTML(content.name)}</h1>`);
  sections.push(`<p style="margin:0 0 2px 0; font-size:12px;">${escapeHTML(content.role)}</p>`);
  if (content.badge) {
    sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">${escapeHTML(content.badge)}</p>`);
  } else {
    sections.push(`<p style="margin:0 0 12px 0;"></p>`);
  }

  // Información de contacto
  sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.contactInfo}</p>`);
  sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">
    ${finalLabels.location}: ${escapeHTML(content.location)} | 
    ${finalLabels.email}: ${escapeHTML(content.email)} | 
    ${finalLabels.phone}: ${escapeHTML(content.phone)} | 
    ${finalLabels.languages}: ${escapeHTML(content.languages)}
  </p>`);

  // Resumen
  if (content.summary) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.summary}</p>`);
    sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">${escapeHTML(content.summary)}</p>`);
  }

  // Acerca de
  if (content.about) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">ABOUT</p>`);
    sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">${escapeHTML(content.about)}</p>`);
  }

  // Experiencia
  if (content.experience && content.experience.length > 0) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.experience}</p>`);
    content.experience.forEach((item) => {
      sections.push(`<p style="margin:0 0 1px 0; font-size:10px;"><strong>${escapeHTML(item.title)}</strong> (${escapeHTML(item.period)})</p>`);
      sections.push(`<p style="margin:0 0 8px 10px; font-size:10px;">${escapeHTML(item.description)}</p>`);
    });
    sections.push(`<p style="margin:0 0 12px 0;"></p>`);
  }

  // Certificaciones
  if (content.certifications && content.certifications.length > 0) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.certifications}</p>`);
    content.certifications.forEach((item) => {
      sections.push(`<p style="margin:0 0 2px 0; font-size:10px;">- ${escapeHTML(item.name)} - ${escapeHTML(item.issuer)} (${escapeHTML(item.year)})</p>`);
    });
    sections.push(`<p style="margin:0 0 12px 0;"></p>`);
  }

  // Proyectos
  if (content.projects && content.projects.length > 0) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.projects}</p>`);
    content.projects.forEach((item) => {
      sections.push(`<p style="margin:0 0 1px 0; font-size:10px;"><strong>${escapeHTML(item.title)}</strong></p>`);
      sections.push(`<p style="margin:0 0 1px 0; font-size:10px;">${escapeHTML(item.description)}</p>`);
      sections.push(`<p style="margin:0 0 8px 10px; font-size:10px;"><strong>Stack:</strong> ${escapeHTML(item.stack || '')}</p>`);
    });
    sections.push(`<p style="margin:0 0 12px 0;"></p>`);
  }

  // Habilidades
  if (content.skills && content.skills.length > 0) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.skills}</p>`);
    sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">${content.skills.join(', ')}</p>`);
  }

  // Palabras clave
  const keywordSet = new Set();
  content.skills.forEach((skill) => keywordSet.add(String(skill || '').trim()));
  if (content.projects) {
    content.projects.forEach((project) => {
      String(project.stack || '')
        .split(/[;,/]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => keywordSet.add(part));
    });
  }
  const keywords = Array.from(keywordSet).filter(Boolean).join(', ');
  if (keywords) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">KEYWORDS</p>`);
    sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">${escapeHTML(keywords)}</p>`);
  }

  // Mensaje de contacto
  if (content.contactMessage) {
    sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.contactMessage}</p>`);
    sections.push(`<p style="margin:0 0 12px 0; font-size:10px;">${escapeHTML(content.contactMessage)}</p>`);
  }

  // Perfiles sociales
  sections.push(`<p style="margin:0 0 2px 0; font-size:10px; font-weight:bold;">${finalLabels.socialProfiles}</p>`);
  sections.push(`<p style="margin:0 0 0 0; font-size:10px;">
    LinkedIn: ${content.social.linkedin || 'N/A'} | 
    GitHub: ${content.social.github || 'N/A'} | 
    Portfolio: ${content.social.portfolio || 'N/A'}
  </p>`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>${escapeHTML(content.name)} - CV ATS Friendly</title>
      <style>
        * { margin: 0; padding: 0; }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 20mm 15mm;
        }
        h1, p { margin: 0; font-weight: normal; }
        h1 { font-size: 14pt; padding-bottom: 4px; }
        strong { font-weight: bold; }
      </style>
    </head>
    <body>
      ${sections.join('')}
    </body>
    </html>
  `;

  return html;
}

async function downloadATSPDF(content, labels) {
  const localeSuffix = currentLocale === 'en' ? 'EN' : 'ES';
  const safeName = content.name.replace(/\s+/g, '_');
  const filename = `${safeName}_CV_ATS_${localeSuffix}.pdf`;
  
  const html = generateATSFriendlyHTML(content, labels);
  const element = document.createElement('div');
  element.innerHTML = html;
  refs.pdfContainer.appendChild(element);

  try {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.25, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: 'avoid', avoid: ['p'] },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error downloading ATS PDF:', error);
    alert('Could not download ATS CV. Please try again.');
  } finally {
    refs.pdfContainer.removeChild(element);
  }
}

function downloadATSText(content, labels) {
  // Mantener para compatibilidad, pero usar downloadATSPDF
  return downloadATSPDF(content, labels);
}

async function downloadCVPDF(format) {
  const content = currentLocale !== 'es' ? translatedContent : cvContent;
  const localeText = UI_TEXT[currentLocale] || UI_TEXT.es;
  const pdfLabels = currentLocale === 'es' ? {aboutTitle:'Sobre mí',experienceTitle:'Experiencia',certificationsTitle:'Certificaciones',projectsTitle:'Proyectos',skillsTitle:'Habilidades',contactTitle:'Contacto',location:'Ubicación',email:'Email',phone:'Teléfono',languages:'Idiomas',stackLabel:'Stack',contactInfo:'CONTACT INFORMATION',summary:'SUMMARY',about:'ABOUT',experience:'EXPERIENCE',certifications:'CERTIFICATIONS',projects:'PROJECTS',skills:'SKILLS',contactMessage:'CONTACT MESSAGE',socialProfiles:'SOCIAL PROFILES'} : {aboutTitle:'About me',experienceTitle:'Experience',certificationsTitle:'Certifications',projectsTitle:'Projects',skillsTitle:'Skills',contactTitle:'Contact',location:'Location',email:'Email',phone:'Phone',languages:'Languages',stackLabel:'Stack',contactInfo:'CONTACT INFORMATION',summary:'SUMMARY',about:'ABOUT',experience:'EXPERIENCE',certifications:'CERTIFICATIONS',projects:'PROJECTS',skills:'SKILLS',contactMessage:'CONTACT MESSAGE',socialProfiles:'SOCIAL PROFILES'};
  pdfLabels.atsScore = localeText.admin.atsScore;
  pdfLabels.atsLevel = localeText.admin.atsLevel;
  pdfLabels.atsMatched = localeText.admin.atsMatched;
  pdfLabels.atsMissing = localeText.admin.atsMissing;
  pdfLabels.atsSuggestions = localeText.admin.atsSuggestions;
  if (format === 'ats') {
    await downloadATSPDF(content, pdfLabels);
    return;
  }

  const html = generateStyledCVHTML(content, pdfLabels);
  
  const element = document.createElement('div');
  element.innerHTML = html;
  refs.pdfContainer.appendChild(element);

  try {
    const localeSuffix = currentLocale === 'en' ? 'EN' : 'ES';
    const filename = `${content.name.replace(/\s+/g, '_')}_CV_${localeSuffix}.pdf`;

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

  if (atsPanelApi && typeof atsPanelApi.bind === 'function') {
    atsPanelApi.bind();
  } else {
    refreshATSAnalysisPreview();
  }
}

function getATSJobDescription() {
  return atsPanelApi.getJobDescription();
}

function applyATSSuggestionsToSummary() {
  atsPanelApi.applySuggestionsToSummary();
}

// Calcula score ATS estimado comparando keywords de la vacante con el contenido del CV.
function buildATSAnalysis(jobDescription, content) {
  return atsBuildAnalysis(jobDescription, content, currentLocale, UI_TEXT);
}

function refreshATSAnalysisPreview() {
  atsPanelApi.refresh();
}

function normalizeAtsText(text) {
  return atsNormalizeText(text);
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
  return authApi.isAuthenticated();
}

// Crea cliente Auth0 solo si el SDK y la configuracion estan disponibles.
async function createAuth0ClientInstance() {
  return authApi.createAuth0ClientInstance();
}

// Verifica placeholders para evitar intentos de auth incompletos.
function isAuthConfigured() {
  return authApi.isConfigured();
}

// Accessor central para cliente Auth0.
async function getAuth0Client() {
  return auth0ClientPromise;
}

// Login principal: popup; fallback a redirect cuando el navegador bloquea popups.
async function loginAuth0() {
  return authApi.loginAuth0();
}

// Logout local del cliente Auth0 sin abandonar la pagina.
async function logoutAuth0() {
  return authApi.logoutAuth0();
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
  return renderApi.createSocialLink(label, url);
}

// Estado visual temporal mientras se consulta GitHub API.
function renderGithubStatsSkeleton() {
  githubApi.renderSkeleton();
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
  await githubApi.loadAndRender();
}

// Render final de cards GitHub con fallback si no hay datos.
function renderGithubStats(stats, error) {
  githubApi.render(stats, error);
}

// Convierte fecha ISO a etiqueta relativa en espanol.
function formatRelativeDate(isoDate) {
  return utilFormatRelativeDate(isoDate);
}

// Parsea lineas con formato: campo | campo | campo.
function parsePipeLines(text, keys) {
  return utilParsePipeLines(text, keys);
}

// Convierte telefono libre en href tel compatible con moviles.
function buildPhoneHref(phone) {
  return utilBuildPhoneHref(phone);
}

// Mantiene visual del telefono mientras se sanitiza el enlace.
function formatPhoneDisplay(phone) {
  return utilFormatPhoneDisplay(phone);
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
  return utilEscapeHTML(value);
}

// Permite configurar Auth0 con dominio corto o completo.
function normalizeAuth0Domain(domain) {
  return utilNormalizeAuth0Domain(domain);
}

// Completa callbacks de redirect de Auth0 y reabre admin si habia intencion previa.
async function initializeAuthFlow() {
  return authApi.initializeAuthFlow();
}

// Traduce errores comunes de Auth0 a mensajes mas accionables.
function getAuthErrorMessage(error) {
  return authApi.getAuthErrorMessage(error);
}

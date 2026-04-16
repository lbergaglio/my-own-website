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
import { create as createContentStateModule } from './frontend/content-state-module.js';
import { create as createI18nModule } from './frontend/i18n-module.js';
import { create as createPdfExportModule } from './frontend/pdf-export-module.js';
import { create as createGithubModule } from './frontend/github-module.js';
import { create as createAuthModule } from './frontend/auth-module.js';
import { create as createAdminFlowModule } from './frontend/admin-flow-module.js';

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
      downloadCoverLetter: 'Descargar cover letter',
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
      downloadCoverLetter: 'Download cover letter',
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
  downloadCoverLetterBtn: document.getElementById('download-cover-letter'),
  pdfContainer: document.getElementById('pdf-container'),
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
  atsJobDescription: document.getElementById('ats-job-description'),
  atsAnalyzeBtn: document.getElementById('analyze-ats'),
  atsApplySummaryBtn: document.getElementById('apply-ats-summary'),
  atsAnalysisResult: document.getElementById('ats-analysis-result'),
};

const contentStateApi = createContentStateModule({
  admin,
  storageKey: STORAGE_KEY,
  apiEndpoint: API_ENDPOINT,
  defaultContent,
  normalizeContent,
  parsePipeLines: utilParsePipeLines,
  buildAuthHeaders: () => buildAuthHeaders(),
});

let cvContent = contentStateApi.loadCachedContent() || structuredClone(defaultContent);
let translatedContent = structuredClone(cvContent);

const i18nApi = createI18nModule({
  refs,
  uiText: UI_TEXT,
  localeKey: LOCALE_KEY,
  translationCacheKey: TRANSLATION_CACHE_KEY,
  supportedLocales: SUPPORTED_LOCALES,
  readLocaleValue: utilReadLocaleValue,
  refreshATSAnalysisPreview: () => refreshATSAnalysisPreview(),
  setTranslatedContent: (content) => {
    translatedContent = content;
  },
});

let currentLocale = i18nApi.getCurrentLocale();

const atsPanelApi = createAtsPanel({
  admin,
  storageKey: ATS_JOB_DESCRIPTION_KEY,
  getCurrentLocale: () => currentLocale,
  getLocaleText: () => i18nApi.getLocaleText(),
  getContent: () => cvContent,
  buildAnalysis: (jobDescription, content) => buildATSAnalysis(jobDescription, content),
  escapeHTML: (value) => escapeHTML(value),
  normalizeText: (value) => normalizeAtsText(value),
});

const githubApi = createGithubModule({
  refs,
  getLocaleText: () => i18nApi.getLocaleText(),
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
  getLocaleText: () => i18nApi.getLocaleText(),
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

const pdfApi = createPdfExportModule({
  refs,
  escapeHTML: (value) => escapeHTML(value),
  getCurrentLocale: () => currentLocale,
  getLocaleText: () => i18nApi.getLocaleText(),
  getContent: () => cvContent,
  getTranslatedContent: () => translatedContent,
  translateContentForLocale: (content, locale) => i18nApi.translateContentForLocale(content, locale),
  promptText: (message, defaultValue) => window.prompt(message, defaultValue),
  alertText: (message) => window.alert(message),
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

const adminFlowApi = createAdminFlowModule({
  admin,
  authApi,
  contentStateApi,
  atsPanelApi,
  renderApi,
  cvContentRef: { current: cvContent },
  defaultContent,
  normalizeContent,
  storageKey: STORAGE_KEY,
  uiText: UI_TEXT,
  buildAuthHeaders: () => buildAuthHeaders(),
  alertText: (message) => window.alert(message),
  getCurrentLocale: () => currentLocale,
  refreshATSAnalysisPreview: () => refreshATSAnalysisPreview(),
});

// Cliente Auth0 lazy (promesa compartida para evitar multiples instancias).
const auth0ClientPromise = createAuth0ClientInstance();

// Estado en memoria del contenido actual del CV.
// Render inicial inmediato para reducir tiempo a primer contenido.
applyStaticLocale(currentLocale, cvContent);
bindLocaleActions();
render(cvContent);
populateForm(cvContent);
initReveal();
adminFlowApi.bind();
pdfApi.bind();
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
  return contentStateApi.fetchRemoteContent();
}

// Estrategia de carga: remoto primero, cache/local como fallback.
async function loadContent() {
  return contentStateApi.loadContent();
}

// Lee cache local y la normaliza para evitar datos corruptos.
function loadCachedContent() {
  return contentStateApi.loadCachedContent();
}

// Determina el idioma inicial segun preferencia guardada o navegador.
function getInitialLocale() {
  return i18nApi.getInitialLocale();
}

// Aplica textos estaticos de la interfaz segun el idioma activo.
function applyStaticLocale(locale, content) {
  return i18nApi.applyStaticLocale(locale, content);
}

// Mantiene el estado visual del selector visible sincronizado.
function syncLocaleSwitcher(locale) {
  return i18nApi.syncLocaleSwitcher(locale);
}

// Conecta los botones visibles del selector con el cambio de idioma.
function bindLocaleActions() {
  refs.localeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextLocale = button.dataset.locale;
      if (!SUPPORTED_LOCALES.includes(nextLocale) || nextLocale === currentLocale) {
        return;
      }

      currentLocale = i18nApi.setCurrentLocale(nextLocale);
      applyStaticLocale(currentLocale, cvContent);
      render(cvContent);
      populateForm(cvContent);
      void loadAndRenderGithubStats();
      void localizeRenderedContent(cvContent);
    });
  });
}

// Lee una clave anidada del diccionario de textos.
function readLocaleValue(source, key) {
  return utilReadLocaleValue(source, key);
}

// Traduce el contenido dinamico renderizado cuando el idioma es distinto de espanol.
async function localizeRenderedContent(content) {
  const translated = await i18nApi.localizeRenderedContent(content, currentLocale);
  if (translated) {
    translatedContent = translated;
  }
}

// Traduce los textos editables del CV con cache local y fallback transparente.
async function translateContentForLocale(content, locale) {
  return i18nApi.translateContentForLocale(content, locale);
}

// Traduce una cadena con cache persistente y servicio publico de Google Translate.
async function translateText(text, locale) {
  return i18nApi.translateText(text, locale);
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

function downloadCVPDF(format) {
  return pdfApi.downloadCVPDF(format);
}

function downloadCoverLetterPDF() {
  return pdfApi.downloadCoverLetterPDF();
}

// Conecta listeners para botones de descarga de CV
function bindDownloadActions() {
  pdfApi.bind();
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











// Consulta estado de sesion en Auth0.
async function isAuthenticated() {
  return authApi.isAuthenticated();
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
  return contentStateApi.collectFormData();
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

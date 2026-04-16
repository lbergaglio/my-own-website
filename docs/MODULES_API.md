# Módulos - Referencia Rápida de APIs

Referencia de todas las funciones públicas de cada módulo, con signatures y ejemplos.

## 📋 Índice

### Módulos Frontend
- [admin-flow-module.js](#admin-flow-modulejs)
- [content-state-module.js](#content-state-modulejs)
- [i18n-module.js](#i18n-modulejs)
- [pdf-export-module.js](#pdf-export-modulejs)
- [render-module.js](#render-modulejs)
- [auth-module.js](#auth-modulejs)
- [github-module.js](#github-modulejs)
- [ats-engine.js](#ats-enginejs)
- [ats-panel.js](#ats-paneljs)
- [utils.js](#utilsjs)

### Referencias
- [Dependency Graph Simplificado](#-dependency-graph-simplificado)
- [Patrones Comunes](#-patrones-comunes)

---

## 📦 Frontend Modules

### admin-flow-module.js

**Creación**:
```javascript
const adminFlowApi = createAdminFlowModule({
  admin,                          // Objeto refs a elementos DOM
  authApi,                        // Módulo de autenticación
  contentStateApi,                // Módulo de estado de contenido
  atsPanelApi,                    // Módulo ATS Panel
  renderApi,                      // Módulo de renderizado
  cvContentRef,                   // { current: cvContent }
  defaultContent,                 // Contenido por defecto
  normalizeContent,               // Función normalizadora
  storageKey,                     // localStorage key
  uiText,                         // UI_TEXT dictionary
  buildAuthHeaders,               // () => Promise<headers>
  alertText,                      // (message) => void
  getCurrentLocale,               // () => string
  refreshATSAnalysisPreview,      // () => void
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `bind()` | `() => void` | - | Conecta todos los event listeners del panel |
| `saveSubmittedContent()` | `() => Promise<void>` | - | Valida, guarda y renderiza cambios del formulario |
| `resetContent()` | `() => Promise<void>` | - | Restaura contenido por defecto |
| `downloadJSON()` | `() => void` | - | Descarga CV actual como archivo JSON |
| `uploadJSON(file)` | `(File) => Promise<void>` | - | Carga CV desde archivo JSON |
| `getATSJobDescription()` | `() => string` | string | Obtiene descripción de vacante ATS |
| `applyATSSuggestionsToSummary()` | `() => void` | - | Aplica sugerencias ATS al summary |
| `refreshATS()` | `() => void` | - | Refresca panel análisis ATS |

**Ejemplos**:

```javascript
// Inicializar
const adminFlowApi = createAdminFlowModule({ ... });
adminFlowApi.bind();

// Guardar contenido manual
await adminFlowApi.saveSubmittedContent();

// Descargar JSON
adminFlowApi.downloadJSON();

// Cargar JSON
const file = document.querySelector('#upload-input').files[0];
await adminFlowApi.uploadJSON(file);
```

---

### content-state-module.js

**Creación**:
```javascript
const contentStateApi = createContentStateModule({
  admin,                  // Refs DOM
  storageKey,            // localStorage key
  apiEndpoint,           // API endpoint URL
  defaultContent,        // Contenido default
  normalizeContent,      // (object) => normalizedObject
  parsePipeLines,        // (text, keys) => parsed
  buildAuthHeaders,      // () => Promise<headers>
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `loadCachedContent()` | `() => object \| null` | object \| null | Lee contenido desde localStorage |
| `fetchRemoteContent()` | `() => Promise<object>` | object | Obtiene contenido de API |
| `loadContent()` | `() => Promise<object>` | object | Async: remoto → cache → default |
| `saveContent(content)` | `(object) => Promise<object>` | object | Persiste en API con Auth0 |
| `collectFormData()` | `() => object \| null` | object \| null | Extrae datos del formulario admin |
| `populateForm(content)` | `(object) => void` | - | Completa formulario con contenido |

**Ejemplos**:

```javascript
// Cargar contenido
const content = await contentStateApi.loadContent();

// Guardar contenido
const saved = await contentStateApi.saveContent({
  name: "John Doe",
  email: "john@example.com",
  // ...
});

// Recolectar datos del formulario
const formData = contentStateApi.collectFormData();
if (formData) {
  await contentStateApi.saveContent(formData);
}
```

---

### i18n-module.js

**Creación**:
```javascript
const i18nApi = createI18nModule({
  refs,                         // DOM refs
  uiText,                       // { es: {...}, en: {...} }
  localeKey,                    // localStorage key para locale
  translationCacheKey,          // localStorage key para cache
  supportedLocales,             // ['es', 'en']
  readLocaleValue,              // (obj, key, locale) => value
  refreshATSAnalysisPreview,    // () => void
  setTranslatedContent,         // (content) => void
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `getCurrentLocale()` | `() => string` | 'es' \| 'en' | Retorna locale actual |
| `setCurrentLocale(locale)` | `(string) => void` | - | Cambia idioma actual |
| `getInitialLocale()` | `() => string` | 'es' \| 'en' | Detecta locale inicial |
| `applyStaticLocale(locale, content)` | `(string, object) => void` | - | Actualiza UI_TEXT en DOM |
| `localizeRenderedContent(content)` | `(object) => Promise<void>` | - | Traduce contenido dinámico |
| `translateContentForLocale(content, locale)` | `(object, string) => Promise<object>` | object | Traduce contenido completo |
| `translateText(text, locale)` | `(string, string) => Promise<string>` | string | Traduce texto individual |
| `getLocaleText()` | `() => object` | object | Retorna UI_TEXT para locale actual |
| `syncLocaleSwitcher(locale)` | `(string) => void` | - | Sincroniza UI botones idioma |

**Ejemplos**:

```javascript
// Obtener locale actual
const locale = i18nApi.getCurrentLocale();  // 'es'

// Cambiar idioma
i18nApi.setCurrentLocale('en');

// Traducir contenido dinámico
await i18nApi.localizeRenderedContent(cvContent);

// Traducir texto individual
const translated = await i18nApi.translateText('Hello world', 'es');
// 'Hola mundo'

// Obtener textos UI
const uiText = i18nApi.getLocaleText();
console.log(uiText.nav.profile);  // 'Profile' (si en) o 'Perfil' (si es)
```

---

### pdf-export-module.js

**Creación**:
```javascript
const pdfApi = createPdfExportModule({
  refs,                          // DOM refs
  escapeHTML,                    // (value) => string
  getCurrentLocale,              // () => string
  getLocaleText,                 // () => object
  getContent,                    // () => object
  getTranslatedContent,          // () => object
  translateContentForLocale,     // (content, locale) => Promise<object>
  promptText,                    // (message, default) => string
  alertText,                     // (message) => void
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `downloadCVPDF(format)` | `(string) => Promise<void>` | - | Descarga CV ('styled' o 'ats') |
| `downloadCoverLetterPDF()` | `() => Promise<void>` | - | Descarga cover letter |
| `bind()` | `() => void` | - | Conecta botones de descarga |
| `generateStyledCVHTML(content, labels)` | `(object, object) => string` | string | Genera HTML formateado (2-col) |
| `generateATSCVHTML(content, labels)` | `(object, object) => string` | string | Genera HTML ATS-optimizado |
| `generateCoverLetterHTML(content, labels, draft)` | `(object, object, object) => string` | string | Genera HTML cover letter |

**Ejemplos**:

```javascript
// Conectar botones
pdfApi.bind();

// Descargar CV formateado
await pdfApi.downloadCVPDF('styled');

// Descargar CV ATS-optimizado
await pdfApi.downloadCVPDF('ats');

// Descargar cover letter
await pdfApi.downloadCoverLetterPDF();
// Prompta: Company, Role, Recipient
```

---

### render-module.js

**Creación**:
```javascript
const renderApi = createRenderModule({
  refs,                          // DOM refs
  admin,                        // Admin refs
  getLocaleText,                // () => object
  getCurrentLocale,             // () => string
  clampPercentage,              // (value) => number
  escapeHTML,                   // (value) => string
  buildPhoneHref,               // (phone) => string
  formatPhoneDisplay,           // (phone) => string
  initReveal,                   // () => void
  localizeRenderedContent,      // (content) => Promise<void>
  refreshATSAnalysisPreview,    // () => void
  ensureGithubSkeleton,         // () => void
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `render(content)` | `(object) => void` | - | Renderiza todas las secciones del CV |
| `populateForm(content)` | `(object) => void` | - | Completa formulario admin con contenido |
| `updateProjectsVisibility(hasProjects)` | `(boolean) => void` | - | Muestra/oculta sección projects |
| `createSocialLink(label, url)` | `(string, string) => HTMLElement` | HTMLElement | Crea enlace social seguro |

**Ejemplos**:

```javascript
// Renderizar CV
renderApi.render(cvContent);

// Llenar formulario
renderApi.populateForm(cvContent);

// Mostrar/ocultar projects
renderApi.updateProjectsVisibility(cvContent.projects.length > 0);

// Crear enlace social
const linkedinLink = renderApi.createSocialLink('LinkedIn', 'https://linkedin.com/in/myprofile');
```

---

### auth-module.js

**Creación**:
```javascript
const authApi = createAuthModule({
  admin,                        // Admin refs
  auth0Config,                  // { domain, clientId, audience }
  auth0RedirectUri,             // URL redirect
  auth0Scope,                   // 'openid profile email'
  auth0Connection,              // 'Username-Password-Authentication'
  authIntentKey,                // localStorage key
  getAuthClientPromise,         // () => Promise<client>
  onOpenAdminPanel,             // () => void
  onCloseAdminPanel,            // () => void
  onOpenAuthModal,              // () => void
  onCloseAuthModal,             // () => void
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `isAuthenticated()` | `() => Promise<boolean>` | boolean | Verifica si usuario autenticado |
| `loginAuth0()` | `() => Promise<void>` | - | Abre popup login (fallback redirect) |
| `logoutAuth0()` | `() => Promise<void>` | - | Cierra sesión local |
| `createAuth0ClientInstance()` | `() => Promise<client>` | client \| null | Crea cliente Auth0 |
| `isConfigured()` | `() => boolean` | boolean | Valida config Auth0 |
| `initializeAuthFlow()` | `() => Promise<void>` | - | Maneja callbacks redirect |
| `getAuthErrorMessage(error)` | `(Error) => string` | string | Traduce errores Auth0 |

**Ejemplos**:

```javascript
// Verificar autenticación
const isAuth = await authApi.isAuthenticated();
if (!isAuth) {
  await authApi.loginAuth0();
}

// Logout
await authApi.logoutAuth0();

// Validar config
if (!authApi.isConfigured()) {
  console.error('Auth0 no configurado');
}
```

---

### github-module.js

**Creación**:
```javascript
const githubApi = createGithubModule({
  refs,                        // DOM refs
  getLocaleText,              // () => object
  getCurrentLocale,           // () => string
  getGithubUsername,          // () => string
  getCacheMinutes,            // () => number
  cacheKey,                   // localStorage key
  escapeHTML,                 // (value) => string
  formatRelativeDate,         // (isoDate) => string
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `loadAndRender()` | `() => Promise<void>` | - | Carga stats y renderiza |
| `render(stats, error)` | `(object, Error) => void` | - | Renderiza cards de stats |
| `renderSkeleton()` | `() => void` | - | Muestra skeleton loader |

**Ejemplos**:

```javascript
// Cargar y renderizar
await githubApi.loadAndRender();

// Renderizar solo (sin cargar)
githubApi.render(statsObject, null);

// Mostrar loader
githubApi.renderSkeleton();
```

---

### ats-engine.js

**Funciones globales** (no es módulo factory):

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `buildAnalysis(jobDesc, content, locale, uiText)` | `(string, object, string, object) => object` | object | Calcula score y análisis ATS |
| `normalizeText(text)` | `(string) => string` | string | Normaliza texto para análisis |

**Objeto retornado por buildAnalysis**:
```javascript
{
  score: 75,                    // 0-100
  matchedKeywords: ['JavaScript', 'React', ...],
  suggestedKeywords: ['TypeScript', 'Node.js', ...],
  analysis: {
    summary: { matched: 3, total: 5 },
    experience: { matched: 8, total: 12 },
    skills: { matched: 15, total: 20 },
    // ...
  }
}
```

**Ejemplos**:

```javascript
const analysis = buildAnalysis(
  'Se busca desarrollador React senior con 5+ años',
  cvContent,
  'es',
  UI_TEXT
);

console.log(analysis.score);  // 75
console.log(analysis.matchedKeywords);  // ['React', 'JavaScript', ...]
console.log(analysis.suggestedKeywords);  // ['TypeScript', 'GraphQL', ...]
```

---

### ats-panel.js

**Creación**:
```javascript
const atsPanelApi = createAtsPanel({
  admin,                    // Admin refs
  storageKey,              // localStorage key
  getCurrentLocale,        // () => string
  getLocaleText,           // () => object
  getContent,              // () => object
  buildAnalysis,           // (jobDesc, content, locale, uiText) => object
  escapeHTML,              // (value) => string
  normalizeText,           // (text) => string
});
```

**API**:

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `bind()` | `() => void` | - | Conecta listeners del panel ATS |
| `refresh()` | `() => void` | - | Recalcula análisis ATS |
| `getJobDescription()` | `() => string` | string | Obtiene descripción de vacante |
| `applySuggestionsToSummary()` | `() => void` | - | Aplica sugerencias al summary |

**Ejemplos**:

```javascript
// Conectar listeners
atsPanelApi.bind();

// Refresco manual
atsPanelApi.refresh();

// Obtener descripción
const jobDesc = atsPanelApi.getJobDescription();

// Aplicar sugerencias
atsPanelApi.applySuggestionsToSummary();
```

---

### utils.js

**Funciones de utilidad** (sin módulo factory):

| Función | Signature | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `readLocaleValue(obj, key, locale)` | `(object, string, string) => any` | any | Lee valor multiidioma |
| `escapeHTML(value)` | `(string) => string` | string | Escapa caracteres HTML |
| `formatRelativeDate(isoDate)` | `(string) => string` | string | Formatea fecha relativa |
| `parsePipeLines(text, keys)` | `(string, array) => array` | array | Parsea líneas con separador \| |
| `buildPhoneHref(phone)` | `(string) => string` | string | Crea enlace tel:// |
| `formatPhoneDisplay(phone)` | `(string) => string` | string | Formatea teléfono para display |
| `normalizeAuth0Domain(domain)` | `(string) => string` | string | Normaliza dominio Auth0 |

**Ejemplos**:

```javascript
// Leer valor multiidioma
const summary = readLocaleValue(cvContent.summary, 'es');

// Escapar HTML
const safe = escapeHTML('<script>alert("XSS")</script>');
// &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

// Formatear fecha relativa
const relative = formatRelativeDate('2025-03-15T10:30:00Z');
// "hace un mes" (si hoy es ~abril 2025)

// Parsear líneas pipe-separadas
const lines = parsePipeLines('python | react | node.js', ['lang1', 'lang2', 'lang3']);
// ['python', 'react', 'node.js']

// Crear enlace teléfono
const href = buildPhoneHref('+34 654 321 098');
// 'tel:+34654321098'

// Formatear teléfono
const display = formatPhoneDisplay('+34654321098');
// '+34 654 321 098'
```

---

## 🔗 Dependency Graph Simplificado

```
script.js (orquestador)
  ├── contentStateApi
  │   └── buildAuthHeaders
  ├── i18nApi
  │   └── (standalone)
  ├── renderApi
  │   └── i18nApi
  ├── pdfApi
  │   ├── i18nApi
  │   └── renderApi
  ├── authApi
  │   └── (Auth0 SDK)
  ├── adminFlowApi
  │   ├── authApi
  │   ├── contentStateApi
  │   ├── renderApi
  │   └── atsPanelApi
  ├── atsPanelApi
  │   └── atsEngine
  ├── githubApi
  │   └── (standalone)
  └── atsEngine (no factory)
```

---

## 💡 Patrones Comunes

### 1. Inicializar Módulo

```javascript
const myApi = createMyModule({
  // Inyectar deps
  ref1, ref2, callback1,
  // ...
});

// Conectar listeners
myApi.bind();
```

### 2. Usar Módulo

```javascript
// Llamar método
const result = myApi.someMethod(arg1, arg2);

// Usar promesa si es async
const result = await myApi.asyncMethod(arg1);
```

### 3. Actualizar Estado

```javascript
// Si el módulo expone setState-like
myApi.setState(newState);

// O callbacks durante init
const deps = {
  onStateChange: (newState) => {
    console.log('State changed:', newState);
  }
};
```

---

**Última actualización**: Abril 2026  
**Versión**: 2.0  
**Estado**: ✅ COMPLETO

# Mi Sitio Web - Documentación Técnica

## 📋 Índice

- [Descripción General](#-descripción-general)
- [Arquitectura Técnica](#-arquitectura-técnica)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Flujo de Datos y Orquestación](#-flujo-de-datos-y-orquestación)
- [Módulos del Frontend](#-módulos-del-frontend)
- [Autenticación y Autorización](#-autenticación-y-autorización)
- [Persistencia de Datos](#-persistencia-de-datos)
- [Backend API](#-backend-api)
- [Instalación y Desarrollo](#-instalación-y-desarrollo)
- [Flujo de Edición del Contenido](#-flujo-de-edición-del-contenido)
- [Sistema de Idiomas](#-sistema-de-idiomas)
- [Exportación PDF](#-exportación-pdf)
- [Análisis ATS](#-análisis-ats)
- [Testing](#-testing)
- [Debugging](#-debugging)
- [Mantenimiento](#-mantenimiento)
- [Referencias](#-referencias)

---

## 📋 Descripción General

Este es un sitio web personal que funciona como un **CV profesional interactivo y editable** con funcionalidades avanzadas como:

- 🌍 **Soporte multiidioma** (Español/Inglés)
- 🎯 **Análisis ATS** para optimizar CV para sistemas de selección automática
- 📄 **Exportación a PDF** (CV formateado, ATS-optimizado, cover letter)
- 🔐 **Autenticación Auth0** para acceso protegido
- 📊 **Integración GitHub** para mostrar estadísticas en vivo
- 📱 **Diseño responsive** y accesible

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

- **Frontend**: ES6 modules, vanilla JavaScript
- **Backend**: Node.js serverless (Vercel)
- **Autenticación**: Auth0 SPA SDK
- **Base de datos**: MongoDB
- **Traducciones**: Google Translate API
- **PDF**: html2pdf.js + jsPDF + html2canvas
- **Deployment**: Vercel

---

## 📁 Estructura del Proyecto

```
my-own-website/
├── script.js                     # Orquestador principal
├── index.html                    # Página de entrada
├── package.json                  # Dependencias
├── content-model.js              # Modelo de datos del CV
├── vercel.json                   # Configuración Vercel
├── LOCALHOST_SETUP.md            # Guía de desarrollo local
├── ARCHITECTURE.md               # Documentación de arquitectura
├── CHANGELOG.md                  # Historial de cambios
├── MODULES_API.md                # Referencia de APIs de módulos
├── STYLES_STRUCTURE.md           # Guía de estructura CSS
│
├── styles/                       # Estilos modularizados (NEW)
│   ├── styles.css                # Archivo principal (imports all)
│   ├── README.md                 # Documentación de estilos
│   ├── 00-variables-reset.css    # Variables CSS y reset
│   ├── 01-layout.css             # Layout, grid, flexbox
│   ├── 02-typography.css         # Tipografía
│   ├── 03-components.css         # Botones, switches, links
│   ├── 04-cards.css              # Cards y tarjetas
│   ├── 05-forms.css              # Formularios e inputs
│   ├── 06-hero.css               # Hero section
│   ├── 07-sections.css           # Secciones de contenido
│   ├── 08-modals.css             # Modales y paneles
│   ├── 09-animations.css         # Animaciones y transiciones
│   └── 10-responsive.css         # Media queries
│
├── frontend/                     # Módulos del frontend
│   ├── render-module.js          # Renderizado del DOM
│   ├── auth-module.js            # Lógica de autenticación
│   ├── admin-flow-module.js      # Flujo administrativo (NEW)
│   ├── content-state-module.js   # Gestión de estado de contenido (NEW)
│   ├── i18n-module.js            # Multiidioma e i18n (NEW)
│   ├── pdf-export-module.js      # Exportación PDF (NEW)
│   ├── github-module.js          # Integración GitHub
│   ├── ats-engine.js             # Motor de análisis ATS
│   ├── ats-panel.js              # Panel de análisis ATS
│   └── utils.js                  # Utilidades compartidas
│
├── api/                          # Backend serverless
│   ├── config.js                 # Endpoint de configuración
│   ├── content.js                # Endpoint CRUD de contenido
│   ├── github.js                 # Proxy de GitHub API
│   └── lib/
│       ├── auth.js               # Validación de tokens Auth0
│       ├── http.js               # Utilidades HTTP
│       └── mongo.js              # Conexión MongoDB
│
└── lib/
    └── github.js                 # Cliente GitHub (legacy)
```

---

## 🔄 Flujo de Datos y Orquestación

### Bootstrap (`script.js`)

1. **Inicialización de módulos** en orden de dependencias:
   - `contentStateApi`: Gestión de contenido (local/remoto)
   - `i18nApi`: Sistema de idiomas
   - `renderApi`: Renderizado del DOM
   - `pdfApi`: Exportación PDF
   - `authApi`: Autenticación Auth0
   - `githubApi`: Estadísticas GitHub
   - `adminFlowApi`: Flujo administrativo

2. **Render inicial** (antes de async):
   - Aplica locale estático
   - Renderiza contenido
   - Completa formulario admin

3. **Bootstrap async**:
   - Carga contenido remoto (CMS)
   - Carga estadísticas GitHub
   - Inicia flujo Auth0
   - Traduce contenido si es necesario

### Estado Global (en `script.js`)

```javascript
let cvContent              // Contenido actual del CV
let translatedContent      // Contenido traducido (cacheado)
let currentLocale          // Locale actual ('es' o 'en')
const auth0ClientPromise   // Promesa lazy del cliente Auth0
```

---

## 📦 Módulos del Frontend

### 1. **render-module.js** - Renderizado del DOM

**Responsabilidad**: Actualizar el DOM basado en el modelo de contenido.

**API principal**:
- `render(content)`: Renderiza todas las secciones del CV
- `populateForm(content)`: Rellena el formulario admin
- `updateProjectsVisibility(hasProjects)`: Muestra/oculta sección de proyectos
- `createSocialLink(label, url)`: Crea enlace social seguro

**Dependencias**:
- Refs a elementos del DOM
- Funciones de utilidad (escape HTML, formateo, etc.)
- i18nApi para textos localizados

---

### 2. **auth-module.js** - Autenticación Auth0

**Responsabilidad**: Gestionar el flujo de autenticación con Auth0.

**API principal**:
- `isAuthenticated()`: Verifica si el usuario está autenticado
- `loginAuth0()`: Inicia popup de login (fallback a redirect)
- `logoutAuth0()`: Cierra sesión local
- `createAuth0ClientInstance()`: Crea cliente Auth0
- `isConfigured()`: Valida que Auth0 está configurado
- `getAuthErrorMessage(error)`: Traduce errores de Auth0

**Dependencias**:
- Auth0 SPA SDK (global `auth0`)
- Configuración Auth0 (domain, clientId, etc.)
- Callbacks para abrir/cerrar modales

---

### 3. **admin-flow-module.js** - Flujo Administrativo (NEW)

**Responsabilidad**: Gestionar todas las acciones del panel admin (edición, guardado, reset, import/export).

**API principal**:
- `bind()`: Conecta todos los event listeners
- `saveSubmittedContent()`: Valida y guarda cambios del formulario
- `resetContent()`: Restaura contenido por defecto
- `downloadJSON()`: Descarga contenido como JSON
- `uploadJSON(file)`: Carga contenido desde JSON
- `getATSJobDescription()`: Obtiene descripción de vacante para ATS
- `applyATSSuggestionsToSummary()`: Aplica sugerencias ATS al summary

**Flujo de guardado**:
1. Valida datos del formulario
2. Llamaa `contentStateApi.saveContent()`
3. Actualiza `cvContent`
4. Renderiza interfaz
5. Completa formulario

**Dependencias**:
- contentStateApi
- renderApi
- authApi
- atsPanelApi
- Referencias al DOM del panel admin

---

### 4. **content-state-module.js** - Gestión de Estado (NEW)

**Responsabilidad**: Encapsular lógica de carga, guardado y persistencia del contenido.

**API principal**:
- `loadCachedContent()`: Lee localStorage
- `fetchRemoteContent()`: Obtiene de API remota
- `loadContent()`: Intenta remoto → cache → default
- `saveContent(content)`: Persiste en API con Auth0
- `collectFormData()`: Extrae datos del formulario admin

**Estrategia de fallback**:
```
saveContent() → CMS Remoto (con Auth0 token)
loadContent() → CMS Remoto → localStorage → Contenido por defecto
```

**Dependencias**:
- API_ENDPOINT (backend)
- buildAuthHeaders() para tokens
- normalizeContent() del modelo de datos

---

### 5. **i18n-module.js** - Multiidioma (NEW)

**Responsabilidad**: Gestionar idiomas, traducciones dinámicas y cache de traducciones.

**API principal**:
- `getCurrentLocale()`: Retorna idioma actual
- `setCurrentLocale(locale)`: Cambia idioma
- `applyStaticLocale(locale, content)`: Actualiza UI_TEXT en DOM
- `localizeRenderedContent(content)`: Traduce contenido dinámico
- `translateText(text, locale)`: Traduce texto (con cache)
- `getLocaleText()`: Retorna textos UI para el idioma actual

**Traducción dinámica**:
- Usa Google Translate API (endpoint público)
- Cache en localStorage: `TRANSLATION_CACHE_KEY`
- Formato cache: `{locale}::{originalText} → translatedText`

**Soporta**:
- Español (es) - idioma por defecto
- Inglés (en) - traducido dinámicamente
- Detección de navegador
- Preferencia persistida en localStorage

**Dependencias**:
- UI_TEXT (diccionario estático de etiquetas)
- readLocaleValue para acceso a datos multiidioma

---

### 6. **pdf-export-module.js** - Exportación PDF (NEW)

**Responsabilidad**: Generar HTML formateado y exportar a PDF en múltiples formatos.

**API principal**:
- `downloadCVPDF(format)`: Descarga CV (formato 'styled' o 'ats')
- `downloadCoverLetterPDF()`: Descarga cover letter con prompt de datos
- `bind()`: Conecta botones de descarga

**Formatos generados**:

1. **Styled CV**: Dos columnas (left: about/skills/contact, right: experience/certs/projects)
2. **ATS CV**: Monoespaciado, linear, optimizado para parsers automáticos
3. **Cover Letter**: Carta formal con recipient/company/role dinámicos

**Características**:
- CSS inline para compatibilidad de impresión
- Secuencias de espera para cargar fuentes
- Manejo de errores con feedback visual
- Traducciones localizadas (ES/EN)

**Dependencias**:
- html2pdf.js (con jsPDF + html2canvas)
- getCurrentLocale() e i18nApi para traducciones
- escapeHTML() para seguridad XSS

---

### 7. **github-module.js** - Integración GitHub

**Responsabilidad**: Obtener estadísticas GitHub en vivo con cache.

**API principal**:
- `loadAndRender()`: Carga estadísticas y renderiza
- `render(stats, error)`: Renderiza datos o error
- `renderSkeleton()`: Muestra skeleton loader

**Cache**:
- LocalStorage con TTL configurable (default: 30 min)
- Regenera automáticamente si expiró

**Estadísticas**:
- Repositorios públicos
- Estrellas totales
- Actividad reciente

---

### 8. **ats-engine.js** - Motor ATS

**Responsabilidad**: Analizar compatibilidad CV ↔ Descripción de vacante.

**API principal**:
- `buildAnalysis(jobDescription, content, locale, uiText)`: Calcula score y keywords

**Análisis**:
- Extrae keywords de vacante y CV
- Calcula % de coincidencia
- Sugiere palabras clave faltantes
- Identifica secciones débiles

---

### 9. **ats-panel.js** - Panel ATS

**Responsabilidad**: UI del análisis ATS.

**API principal**:
- `bind()`: Conecta formulario y análisis
- `refresh()`: Recalcula análisis
- `getJobDescription()`: Obtiene descripción de vacante
- `applySuggestionsToSummary()`: Aplica sugerencias al summary

---

### 10. **utils.js** - Utilidades Compartidas

**Funciones**:
- `readLocaleValue(obj, key, locale)`: Lee valores multiidioma
- `escapeHTML(value)`: Sanitiza HTML
- `formatRelativeDate(isoDate)`: Formatea fechas relativas (ej: "hace 2 días")
- `parsePipeLines(text, keys)`: Parsea líneas con separador `|`
- `buildPhoneHref(phone)`: Crea enlace tel://
- `formatPhoneDisplay(phone)`: Formatea teléfono para visualización
- `normalizeAuth0Domain(domain)`: Normaliza dominio Auth0 corto/completo

---

## 🔒 Autenticación y Autorización

### Flujo Auth0

1. **Login**:
   - Usuario hace clic en "Abrir admin"
   - Si NO autenticado → abre modal de login
   - Modal submit llama `authApi.loginAuth0()`
   - Auth0 popup (o redirect si bloqueado)
   - Callback regresa y abre panel admin

2. **Sesión**:
   - Token guardado en memoria del cliente Auth0
   - `getTokenSilently()` para endpoints protegidos
   - Scope: `openid profile email`
   - Audience (opcional): API backend

3. **Logout**:
   - Cierra sesión Auth0 (local, sin redirect)
   - Cierra panel admin

### Headers Autorizados

```javascript
// buildAuthHeaders() en script.js
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
}
```

---

## 💾 Persistencia de Datos

### Contenido del CV

**Remoto (CMS)**:
- Endpoint: `PUT /api/content` (protegido)
- Persiste cambios del usuario autenticado
- Es la fuente de verdad

**Local (localStorage)**:
- Key: `cv-content-v1`
- Fallback si API no disponible
- Se sincroniza al guardar

**Default**:
- En memoria: `defaultContent` (content-model.js)
- Usado si no hay remoto/local

### Traducciones

**Cache de traducciones**:
- Key: `cv-translation-cache-v1`
- Formato: `{ "es::Hello": "Hola", "es::World": "Mundo" }`
- Evita llamadas repetidas a Google Translate API

### Preferencias UI

- **Locale**: `cv-ui-locale-v1` (idioma actual)
- **ATS Job Description**: `cv-ats-job-description-v1` (descripción de vacante)
- **GitHub Cache**: `cv-github-stats-v2` (últimas estadísticas + timestamp)

---

## 🔌 Backend API (`/api`)

### POST /api/config

Retorna configuración runtime inyectada en `window.__CV_CONFIG`:

```javascript
{
  auth0Domain: "xxxxx.auth0.com",
  auth0ClientId: "xxxxx",
  auth0Audience: "https://api.example.com",
  auth0RedirectUri: "https://example.com",
  auth0Connection: "Username-Password-Authentication",
  githubUsername: "miusuario",
  githubStatsCacheMinutes: 30
}
```

### GET /api/content

Obtiene contenido actual (público, sin auth).

**Response**:
```json
{
  "name": "...",
  "email": "...",
  "summary": "...",
  "experience": [...],
  "certifications": [...],
  "projects": [...]
}
```

### PUT /api/content

Guarda contenido (requiere Auth0 token).

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body**: Objeto de contenido completo

### GET /api/github

Proxy de GitHub API para obtener estadísticas públicas.

---

## 🚀 Instalación y Desarrollo

### Requisitos

- Node.js 18+
- MongoDB (si usas backend local)
- Cuenta Auth0
- Cuenta GitHub

### Configuración Local

Ver [LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md) para detalles completos.

**Resumen**:
```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env.local con configuración Auth0
cp .env.example .env.local

# 3. Iniciar servidor local
npm run dev

# 4. Visitar http://localhost:3000
```

### Variables de Entorno

```env
AUTH0_DOMAIN=xxxxx.auth0.com
AUTH0_CLIENT_ID=xxxxx
AUTH0_AUDIENCE=https://api.example.com
AUTH0_REDIRECT_URI=http://localhost:3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
GITHUB_USERNAME=miusuario
```

---

## 📊 Flujo de Edición del Contenido

1. Usuario hace clic "Abrir admin" en CV
2. Si NO autenticado:
   - Abre modal Auth0
   - Inicia sesión
   - Abre panel admin
3. Panel admin se rellena con contenido actual via `populateForm()`
4. Usuario edita campos (name, email, experience, skills, etc.)
5. Envía formulario:
   - `collectFormData()` extrae valores
   - `adminFlowApi.saveSubmittedContent()` valida
   - `contentStateApi.saveContent()` persiste en API
   - `renderApi.render()` actualiza CV en vivo
   - `renderApi.populateForm()` refresca formulario
6. Cambios reflejados en CV visual y localStorage

---

## 🎨 Sistema de Idiomas

### Textos Estáticos (UI_TEXT en script.js)

```javascript
UI_TEXT = {
  es: {
    nav: { profile: "Perfil", experience: "Experiencia", ... },
    hero: { contact: "Contactar", downloadCV: "Descargar CV", ... },
    ...
  },
  en: {
    nav: { profile: "Profile", experience: "Experience", ... },
    ...
  }
}
```

### Contenido Dinámico (en `content-model.js`)

Cada campo puede tener valores por idioma:

```javascript
{
  summary: {
    es: "Ingeniero de software...",
    en: "Software engineer..."
  }
}
```

Acceso via `readLocaleValue(summary, 'en')` en utils.js.

### Traducción Automática

Contenido sin traducción manual es traducido dinámicamente via Google Translate:

1. Usuario cambia a inglés
2. i18nApi llama `translateText()` para cada campo
3. Resultado cacheado en localStorage
4. Próximas cargas usan cache

---

## 📈 Exportación PDF

### CV Estilizado

- Dos columnas responsive
- Colores y tipografía profesionales
- Incluye: About, Skills (left); Experience, Certifications, Projects (right)
- Optimizado para impresión

### CV ATS-Optimizado

- Monoespaciado (evita incompatibilidades de formateo)
- Linear sin columnas
- Énfasis en keywords extraíbles
- Palabras clave de experiencia/habilidades destacadas

### Cover Letter

- Template formal
- Requiere: Company, Role, Recipient name
- Genera cuerpo basado en skills y experience del CV
- 4 párrafos: intro, background, skills match, closing

---

## 🔍 Análisis ATS

### Score Calculation

```
Score = (coinciding_keywords / total_keywords) * 100
```

### Análisis incluye:

- % de coincidencia
- Keywords coincidentes
- Keywords faltantes (sugerencias)
- Secciones fuerte/débiles del CV

### Optimizaciones sugeridas:

- Agregar skills faltantes
- Expandir experience con keywords de la vacante
- Mejorar summary con términos relevantes

---

## 🧪 Testing (Recomendaciones)

### Test Manual Checklist

- [ ] CV carga correctamente en inicializador
- [ ] Cambio de idioma (ES ↔ EN) funciona
- [ ] Descarga PDF (styled) genera archivo válido
- [ ] Descarga PDF (ATS) es monoespaciado
- [ ] Descarga cover letter solicita datos y genera
- [ ] Login Auth0 abre panel admin
- [ ] Editar contenido persiste en localStorage
- [ ] Guardar contenido (con Auth0) persiste en API
- [ ] Logout cierra sesión y panel admin
- [ ] Reset restaura contenido por defecto
- [ ] Upload/download JSON funciona
- [ ] Análisis ATS calcula score correctamente
- [ ] GitHub stats cargan y se cachean

### Test de Performance

- Tiempo a primer contenido: < 1s (cached)
- Tiempo de carga remota: < 2s (con API)
- Cambio de idioma: < 300ms (cached)

---

## 🐛 Debugging

### Errores comunes

**"Auth0 no esta configurado"**
- Verifica `AUTH0_CONFIG` en script.js
- Reemplaza placeholders con valores reales

**"No se pudo guardar el contenido"**
- Verifica token Auth0 es válido
- Chequea endpoint API está disponible
- Revisa CORS en backend

**Traducciones no actualizan**
- Limpia localStorage: `TRANSLATION_CACHE_KEY`
- Verifica Google Translate API es accesible

**PDF no descarga**
- Verifica html2pdf.js está cargado
- Chequea permisos de blob en navegador

### Console Logging

Todos los módulos pueden agregarse `console.log()` en funciones críticas.

---

## 📝 Mantenimiento

### Agregar nuevo campo al CV

1. Agregá campo en `content-model.js` (defaultContent)
2. Agregá entrada en formulario admin (`index.html`)
3. Agregá rendering en `render-module.js`
4. Agregá localización en `UI_TEXT` si es etiqueta
5. Test: guardá, recargá, validá persistencia

### Agregar nuevo idioma

1. Agregá código en `SUPPORTED_LOCALES` (script.js)
2. Agregá traducciones en `UI_TEXT`
3. Traducción automática funcionará para contenido dinámico

### Actualizar Auth0

1. Cambiar `AUTH0_CONFIG` en script.js
2. Cambiar `AUTH0_REDIRECT_URI` si cambia URL
3. Validar callback URL en Auth0 dashboard

---

## 📚 Referencias

- [Auth0 SPA SDK Docs](https://auth0.com/docs/libraries/auth0-spa-js)
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- [Google Translate API](https://cloud.google.com/translate/docs/reference)
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## 📄 Licencia

Proyecto personal. Derechos reservados.

---

**Última actualización**: Abril 2026  
**Versión**: 2.0 (Completamente modularizado)

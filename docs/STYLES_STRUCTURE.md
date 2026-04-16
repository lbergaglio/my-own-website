# Guía de Estilos CSS Modularizados

## 📋 Índice

- [Descripción General](#-descripción-general)
- [Estructura de Directorios](#-estructura-de-directorios)
- [Arquitectura CSS](#-arquitectura-css)
- [Módulos CSS](#-módulos-css)
- [Cómo Usar](#-cómo-usar)
- [Mejores Prácticas](#-mejores-prácticas)
- [Mantenimiento](#-mantenimiento)
- [Performance](#-performance)

---

## 📝 Descripción General

El CSS del proyecto ha sido **completamente modularizado** desde un monolítico de 806 líneas a **11 módulos especializados**, cada uno con una responsabilidad clara.

### Beneficios

| Aspecto | Antes | Después |
|--------|-------|---------|
| Tamaño archivo | 1 × 806 líneas | 11 × ~50-100 líneas c/u |
| Mantenibilidad | Difícil (buscar en 800 líneas) | Fácil (conoces exactamente dónde) |
| Escalabilidad | Lenta (archivo crece) | Rápida (módulos independientes) |
| Caching | Todo o nada | Por módulo |
| Team work | Conflictos frecuentes | Menos conflictos (archivos separados) |

---

## 📂 Estructura de Directorios

```
my-own-website/
├── index.html
├── script.js
├── styles/                       # Nuevo: Directorio modularizado
│   ├── styles.css               # Principal (imports all)
│   ├── README.md                # Documentación de estilos
│   ├── 00-variables-reset.css
│   ├── 01-layout.css
│   ├── 02-typography.css
│   ├── 03-components.css
│   ├── 04-cards.css
│   ├── 05-forms.css
│   ├── 06-hero.css
│   ├── 07-sections.css
│   ├── 08-modals.css
│   ├── 09-animations.css
│   └── 10-responsive.css
```

### En HTML

```html
<!-- Link al archivo principal (que importa todos) -->
<link rel="stylesheet" href="styles/styles.css">
```

---

## 🎨 Arquitectura CSS

### Capas CSS (ITCSS inspired)

Los módulos están organizados en **capas de especificidad ascendente**:

```
00-variables-reset.css  ← Variables, resets (especificidad baja)
  ↓
01-layout.css          ← Layout, grids, contenedores
  ↓
02-typography.css      ← Tipografía
  ↓
03-components.css      ← Componentes interactivos (botones, etc)
  ↓
04-cards.css           ← Cards y tarjetas
  ↓
05-forms.css           ← Formularios
  ↓
06-hero.css            ← Secciones específicas
07-sections.css
08-modals.css
  ↓
09-animations.css      ← Animaciones (pueden sobrescribir)
  ↓
10-responsive.css      ← Media queries (especificidad más alta)
```

### Ventaja

Las **media queries van al final** para poder sobrescribir estilos de desktop de forma clara.

---

## 🧩 Módulos CSS

### 1. **00-variables-reset.css** (57 líneas)

**Responsabilidad**: Definir tokens visuales y hacer reset

**Contenido**:
- ✅ Variables CSS (colores, sombras)
- ✅ Reset universal (`*`)
- ✅ Estilos base de `html` y `body`
- ✅ Blobs de fondo decorativos

**Ejemplo**:
```css
:root {
  --bg: #f3f6fb;
  --paper: rgba(255, 255, 255, 0.84);
  --blue: #1067d8;
  --shadow: 0 15px 40px rgba(15, 39, 80, 0.12);
}
```

---

### 2. **01-layout.css** (53 líneas)

**Responsabilidad**: Grids, flexbox, contenedores

**Contenido**:
- ✅ `.wrap` (contenedor central)
- ✅ `.topbar` (header)
- ✅ `.menu` (navegación)
- ✅ Grids de contenido (experience, projects, certifications)

**Ejemplo**:
```css
.experience-grid {
  grid-template-columns: repeat(2, 1fr);
}

.project-grid {
  grid-template-columns: repeat(3, 1fr);
}
```

---

### 3. **02-typography.css** (82 líneas)

**Responsabilidad**: Tipografía, encabezados, etiquetas

**Contenido**:
- ✅ `h1`, `h2`, `h3` y variantes
- ✅ `.lead`, `.body-text`
- ✅ Etiquetas (`.badge-text`, `.section-tag`)
- ✅ Metadatos (`.meta`, `.stack`)

**Ejemplo**:
```css
h1 {
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1.04;
}
```

---

### 4. **03-components.css** (156 líneas)

**Responsabilidad**: Botones, switches, enlaces, componentes interactivos

**Contenido**:
- ✅ `.btn`, `.btn-primary`, `.btn-ghost`
- ✅ `.locale-button`, `.locale-switcher`
- ✅ `.social-link`, `.mail-link`
- ✅ `.github-pill`
- ✅ Acciones (heroes, admin, ATS)

**Ejemplo**:
```css
.btn-primary {
  background: linear-gradient(130deg, var(--blue), #257ee8);
  color: #fff;
  box-shadow: var(--shadow);
}

.btn-primary:hover {
  box-shadow: 0 18px 50px rgba(15, 39, 80, 0.18);
}
```

---

### 5. **04-cards.css** (154 líneas)

**Responsabilidad**: Cards genéricas, paneles, tarjetas

**Contenido**:
- ✅ `.card` (tarjeta genérica)
- ✅ `.hero-panel`
- ✅ `.certification-card` con progreso
- ✅ `.github-stat`, `.github-featured`
- ✅ `.facts-list`

**Ejemplo**:
```css
.card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--shadow);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 50px rgba(15, 39, 80, 0.18);
}
```

---

### 6. **05-forms.css** (161 líneas)

**Responsabilidad**: Formularios, inputs, textarea, validaciones

**Contenido**:
- ✅ `.admin-form`, `.auth-form`
- ✅ Inputs y textarea con focus states
- ✅ `.ats-helper` (panel ATS)
- ✅ `.skill-item` (skills cloud)
- ✅ `.import-label` (upload)

**Ejemplo**:
```css
.admin-form input:focus,
.admin-form textarea:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(16, 103, 216, 0.1);
}
```

---

### 7. **06-hero.css** (30 líneas)

**Responsabilidad**: Hero section específica

**Contenido**:
- ✅ `.hero` grid
- ✅ `.hero-panel` con estilos decorativos

**Ejemplo**:
```css
.hero {
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
}
```

---

### 8. **07-sections.css** (30 líneas)

**Responsabilidad**: Secciones de contenido principal

**Contenido**:
- ✅ `.footer`
- ✅ `.skill-cloud`, `.skill-item`

---

### 9. **08-modals.css** (96 líneas)

**Responsabilidad**: Modales, paneles laterales, triggers

**Contenido**:
- ✅ `.auth-modal` (modal de autenticación)
- ✅ `.admin-panel` (panel lateral)
- ✅ `.admin-trigger` (botón flotante)
- ✅ Animaciones de entrada

**Ejemplo**:
```css
.admin-panel {
  position: fixed;
  right: 0;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.admin-panel.open {
  transform: translateX(0);
}
```

---

### 10. **09-animations.css** (75 líneas)

**Responsabilidad**: Animaciones y transiciones

**Contenido**:
- ✅ `.reveal` (scroll animations)
- ✅ `@keyframes fadeIn`, `fadeOut`, `slideUp`
- ✅ `.skeleton` (skeleton loader)
- ✅ `.loading` (pulse animation)
- ✅ Global transitions

**Ejemplo**:
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

### 11. **10-responsive.css** (102 líneas)

**Responsabilidad**: Media queries y responsive design

**Breakpoints**:
- `@media (max-width: 980px)` → Tablet
- `@media (max-width: 700px)` → Mobile
- `@media (max-width: 480px)` → Small mobile

**Ejemplo**:
```css
@media (max-width: 700px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## ✅ Cómo Usar

### Opción 1: Usar el archivo principal (Recomendado)

```html
<link rel="stylesheet" href="styles/styles.css">
```

El archivo `styles/styles.css` importa automáticamente todos los módulos en orden correcto.

### Opción 2: Importar en JavaScript (si usas bundler)

```javascript
import './styles/styles.css';
```

### Opción 3: Selective Import (para optimización)

```html
<!-- Solo los módulos que necesitas -->
<link rel="stylesheet" href="styles/00-variables-reset.css">
<link rel="stylesheet" href="styles/01-layout.css">
<link rel="stylesheet" href="styles/03-components.css">
```

---

## 💡 Mejores Prácticas

### Agregando un nuevo estilo

**Paso 1**: Identifica la responsabilidad

```
¿Qué es?                          → Archivo
Botón, switch, link              → 03-components.css
Card, panel, tarjeta             → 04-cards.css
Input, textarea, form            → 05-forms.css
Animación, transición            → 09-animations.css
Breakpoint mobile                → 10-responsive.css
```

**Paso 2**: Agrégalo al archivo correspondiente

```css
/* En 03-components.css */
.my-button {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
}

.my-button:hover {
  transform: translateY(-1px);
}
```

**Paso 3**: Usa en HTML

```html
<button class="my-button">Click me</button>
```

### Usando Variables CSS

**Siempre** usa variables en lugar de hardcoding:

```css
/* ✅ Bien */
.card {
  background: var(--paper);
  color: var(--ink);
  box-shadow: var(--shadow);
}

/* ❌ Mal */
.card {
  background: rgba(255, 255, 255, 0.84);
  color: #15202d;
  box-shadow: 0 15px 40px rgba(15, 39, 80, 0.12);
}
```

### Media Queries

**Coloca media queries al final** de cada bloque:

```css
/* Desktop */
.grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet */
@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔧 Mantenimiento

### Encontrar un estilo

**Opción 1**: Grep

```bash
grep -r "my-class" styles/
```

**Opción 2**: Inspeccionar en DevTools
- Haz clic derecho → Inspect
- Busca el archivo CSS en DevTools
- Navega al archivo en tu editor

### Actualizar un estilo

1. Abre el archivo correspondiente
2. Localiza el selector
3. Realiza cambios
4. Guarda

**Ejemplo**:

```css
/* En styles/03-components.css */
.btn-primary {
  /* Cambios aquí */
  background: linear-gradient(130deg, #0052cc, #0066ff); /* Nuevo color */
}
```

### Eliminar un estilo no usado

1. **Busca** en HTML dónde se usa
2. **Elimina** la clase HTML (si es una clase específica)
3. **Elimina** el bloque CSS del archivo

---

## 📊 Performance

### Tamaño

**Antes**: 1 archivo × 806 líneas = 806 líneas  
**Después**: 11 archivos × ~50-150 líneas c/u = 850 líneas (sin compresión)

Con minificación:
- Original: ~24 KB
- Modularizado: ~24 KB (sin cambios en tamaño)

### Beneficios de rendimiento

1. **Mejor caché**: Solo los archivos modificados se recargan
2. **Faster build**: Los bundlers pueden tree-shake CSS no usado
3. **Parallelization**: Descarga de múltiples archivos simultáneamente

### Optimización para producción

**Vite (recomendado)**:
```bash
npm run build
```

**Manual con PostCSS**:
```bash
postcss styles/styles.css --output styles.min.css
```

---

## 📚 Documentación Relacionada

- [README.md](./README.md) - Documentación general del proyecto
- [styles/README.md](./styles/README.md) - Guía detallada de CSS
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del proyecto

---

**Última actualización**: Abril 2026  
**Versión**: 1.0 (CSS modularizado)  
**Estado**: ✅ Completado

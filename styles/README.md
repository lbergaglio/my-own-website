# Estilos CSS - Estructura Modular

## 📋 Índice

- [Descripción](#descripción)
- [Estructura de Archivos](#estructura-de-archivos)
- [Cómo Usar](#cómo-usar)
- [Convenciones](#convenciones)
- [Agregando Nuevos Estilos](#agregando-nuevos-estilos)
- [Performance](#performance)

---

## Descripción

Este directorio contiene **estilos CSS modularizados** en lugar de un único archivo monolítico (`styles.css`).

Cada archivo CSS representa una **responsabilidad clara**:

- Variables y reset
- Layout y contenedores
- Tipografía
- Componentes interactivos
- Cards y tarjetas
- Formularios
- Secciones principales
- Modales
- Animaciones
- Responsive design

**Ventajas**:
- ✅ Fácil de mantener y encontrar estilos
- ✅ Escalable (agregar nuevos componentes)
- ✅ Reutilizable (componentes CSS)
- ✅ Testing (aislar estilos por componente)
- ✅ Rendimiento (cargar solo lo necesario)

---

## Estructura de Archivos

```
styles/
├── styles.css                    # Archivo principal (importa todos)
├── 00-variables-reset.css        # Variables CSS y reset
├── 01-layout.css                 # Layout, grid, flexbox
├── 02-typography.css             # Tipografía
├── 03-components.css             # Botones, switches, links
├── 04-cards.css                  # Cards genéricas
├── 05-forms.css                  # Formularios e inputs
├── 06-hero.css                   # Hero section
├── 07-sections.css               # Secciones (skills, footer)
├── 08-modals.css                 # Auth modal, admin panel
├── 09-animations.css             # Animaciones y transiciones
├── 10-responsive.css             # Media queries
└── README.md                     # Este archivo
```

---

## Cómo Usar

### En HTML

**Importa solo el archivo principal:**

```html
<link rel="stylesheet" href="styles/styles.css">
```

El archivo `styles/styles.css` importa automáticamente todos los módulos.

### En Build Process

Si usas un bundler (webpack, Vite, etc.), puedes:

**Option 1: Importar directamente**
```javascript
import './styles/styles.css';
```

**Option 2: Importar módulos individuales**
```javascript
// Solo lo que necesitas
import './styles/00-variables-reset.css';
import './styles/01-layout.css';
import './styles/03-components.css';
```

---

## Estructura de Cada Archivo

### Encabezado Consistente

```css
/* ===================================
   NOMBRE DEL MÓDULO
   Descripción breve
   =================================== */
```

### Secciones dentro del archivo

```css
/* Grupo lógico de estilos */

.class-name {
  /* estilos */
}

.class-name:hover {
  /* estados interactivos */
}

.class-name.state {
  /* variantes */
}
```

---

## Convenciones

### Naming Classes

```css
/* Componente base */
.btn { }

/* Variante del componente */
.btn-primary { }
.btn-ghost { }

/* Estado */
.btn:hover { }
.btn.active { }
.btn:disabled { }

/* Sub-componente */
.button-group { }
.button-label { }
```

### Variables CSS

Definidas en `00-variables-reset.css`:

```css
:root {
  --bg: #f3f6fb;           /* Colores */
  --ink: #15202d;
  --blue: #1067d8;
  
  --shadow: 0 15px 40px..;  /* Efectos */
  --line: rgba(21, 32, 45, 0.12);
}

/* Uso */
.card {
  background: var(--paper);
  box-shadow: var(--shadow);
}
```

### Media Queries

Breakpoints en `10-responsive.css`:

```css
/* Desktop (default) */
.grid { grid-template-columns: repeat(3, 1fr); }

/* Tablet */
@media (max-width: 980px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile */
@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
}

/* Small mobile */
@media (max-width: 480px) {
  .grid { grid-template-columns: 1fr; }
}
```

---

## Agregando Nuevos Estilos

### Para un nuevo componente

**Paso 1**: Determina la responsabilidad
- ¿Es un botón? → `03-components.css`
- ¿Es una card? → `04-cards.css`
- ¿Es un formulario? → `05-forms.css`
- ¿Es una sección única? → `07-sections.css`

**Paso 2**: Agrégalo al archivo correspondiente

```css
/* En 03-components.css */
.my-new-component {
  /* estilos */
}

.my-new-component:hover {
  /* estado hover */
}
```

**Paso 3**: Usa en HTML

```html
<div class="my-new-component">Contenido</div>
```

### Para un nuevo módulo completo

Si necesitas un **nuevo conjunto de estilos** (ej: theme alternativo):

**Paso 1**: Crea un nuevo archivo

```css
/* styles/11-theme-dark.css */
:root {
  --bg: #1a1a1a;
  --ink: #ffffff;
  /* ... más variables */
}
```

**Paso 2**: Importa en `styles/styles.css`

```css
@import url('./11-theme-dark.css');
```

---

## Performance

### Tamaños

**Antes**: `styles.css` (1 archivo, 806 líneas)  
**Después**: `styles/` (11 archivos modularizados)

**Beneficios**:

1. **Mejor mantenibilidad**: Cada archivo < 100 líneas
2. **Caching**: El navegador cachea archivos que no cambian
3. **Build optimization**: Los bundlers pueden tree-shake CSS no usado
4. **Escalabilidad**: Fácil agregar nuevos componentes

### Optimización

**Para producción**, minifica:

```bash
# Usando postcss + cssnano
postcss styles/styles.css -o styles.min.css
```

O si usas Vite:

```bash
npm run build
```

---

## Migrando Estilos Existentes

Si tienes estilos en otro lugar:

**Paso 1**: Identifica la responsabilidad
**Paso 2**: Copia el bloque CSS al archivo apropiado
**Paso 3**: Asegúrate de que `styles/styles.css` lo importe

**Ejemplo**:

```css
/* styles/04-cards.css */

/* Agrega aquí tus cards personalizadas */
.my-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
}
```

---

## Debugging

### Encontrar dónde está un estilo

**Paso 1**: Inspecciona el elemento en DevTools
**Paso 2**: Busca el archivo que lo define

```bash
# Busca en todos los archivos CSS
grep -r "class-name" styles/
```

**Paso 3**: Edita el archivo correspondiente

### Conflictos de CSS

Si hay conflictos de especificidad:

**Opción 1**: Aumenta especificidad (no recomendado)

```css
/* Evita esto */
.my-component .inner .deep { }
```

**Opción 2**: Usa CSS custom properties

```css
.my-component {
  --my-color: blue;
  color: var(--my-color);
}

.my-component.dark {
  --my-color: white;
}
```

---

## Referencias

- [MDN: CSS Modules](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [BEM Naming](http://getbem.com/)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

**Última actualización**: Abril 2026  
**Versión**: 1.0 (CSS modularizado)

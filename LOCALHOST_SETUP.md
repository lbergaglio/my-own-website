# 🚀 CV Profesional - Setup Localhost

## Instalación y ejecución en localhost

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Configurar variables de entorno (opcional)
```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env con tus valores (si lo deseas):
# - AUTH0_DOMAIN
# - AUTH0_CLIENT_ID
# - GITHUB_USERNAME
```

### 3️⃣ Ejecutar servidor de desarrollo
```bash
npm run dev
# o
npm start
```

El servidor estará disponible en: **http://localhost:3000**

---

## 📥 Descarga de PDF ATS

Cuando ejecutes en localhost, tienes dos opciones de descarga:

### Opción 1: **Descargar CV (PDF Visual)**
- Formato atractivo para lectura humana
- Con estilos y diseño profesional

### Opción 2: **Descargar ATS (PDF Limpio)**
- ✅ Formato optimizado para sistemas ATS
- ✅ Sin estructuras complejas
- ✅ Lineal y fácil de parsear
- Incluye:
  - Contacto
  - Resumen y About
  - Experiencia
  - Certificaciones (con porcentaje si aplica)
  - Proyectos
  - Habilidades
  - Keywords automáticas
  - Redes sociales

---

## ⚙️ Estructura del proyecto

```
├── index.html              # Página principal
├── script.js              # Lógica frontend
├── styles.css             # Estilos
├── content-model.js       # Modelo de datos del CV
├── server.js              # Servidor local Express
├── package.json           # Dependencias
├── .env.example           # Template de variables
└── api/
    ├── config.js          # Config endpoint
    ├── content.js         # Content API endpoint
    └── lib/
        ├── auth.js        # Auth logic
        ├── mongo.js       # MongoDB connection
        └── http.js        # HTTP utilities
```

---

## 🔧 Para desarrollo

El servidor Express:
- Sirve archivos estáticos desde la raíz
- Proporciona endpoints `/api/config` y `/api/content`
- Auto-recarga no incluida (usa `npm run dev`)

Para desarrollo con auto-reload, instala `nodemon`:
```bash
npm install --save-dev nodemon

# Actualizar package.json scripts:
# "dev": "nodemon server.js"
```

---

## 📝 Editar contenido en localhost

El contenido se devuelve desde `server.js` - edita directamente los datos en esa función `GET /api/content` para ver cambios.

Para producción en Vercel, el contenido viene de MongoDB.

---

## 🚢 Deploy a producción (Vercel)

1. Push a GitHub
2. Vercel auto-detecta el proyecto
3. Las funciones serverless en `/api` se usan automáticamente

```bash
git push origin master
```

import express from 'express';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('./'));

// API Routes
app.get('/api/config', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const runtimeConfig = {
    auth0Domain: String(process.env.AUTH0_DOMAIN || '').trim(),
    auth0ClientId: String(process.env.AUTH0_CLIENT_ID || '').trim(),
    auth0Audience: String(process.env.AUTH0_AUDIENCE || '').trim(),
    auth0RedirectUri: String(process.env.AUTH0_REDIRECT_URI || `http://localhost:${PORT}`).trim(),
    auth0Connection: String(process.env.AUTH0_CONNECTION || 'github').trim(),
    githubUsername: String(process.env.GITHUB_USERNAME || 'lbergaglio').trim(),
    githubStatsCacheMinutes: Number(process.env.GITHUB_STATS_CACHE_MINUTES || 30),
  };

  res.status(200).end(`window.__CV_CONFIG = ${JSON.stringify(runtimeConfig)};`);
});

// API content - para desarrollo local, devolver contenido default
app.get('/api/content', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    name: 'Tu Nombre',
    role: 'Desarrollador Web Frontend',
    badge: 'Disponible para nuevas oportunidades',
    summary: 'Construyo experiencias web de alto impacto, enfocadas en usabilidad, rendimiento y resultados de negocio.',
    about: 'Perfil proactivo y orientado a resultados. Experiencia en interfaces modernas, colaboración con equipos producto y optimización continua de procesos digitales.',
    location: 'Ciudad, País',
    email: 'tunombre@email.com',
    phone: '+54 9 11 0000 0000',
    languages: 'Español nativo, Inglés intermedio',
    social: {
      linkedin: 'https://www.linkedin.com/in/luciano-bergaglio-a9001b172/',
      github: 'https://github.com/lbergaglio',
      portfolio: 'https://mi-portafolio.com',
      twitter: 'https://twitter.com/tunombre'
    },
    contactMessage: 'Si te interesa mi perfil para una posición o proyecto, estaré encantado de conversar.',
    skills: [
      'HTML5',
      'CSS3',
      'JavaScript',
      'TypeScript',
      'React',
      'Git',
      'Responsive Design',
      'UI Systems'
    ],
    certifications: [
      {
        name: 'Advanced React',
        issuer: 'Platforma X',
        year: '2024',
        percentage: 100
      }
    ],
    experience: [
      {
        period: '2024 - Actualidad',
        title: 'Desarrollador Frontend - Empresa X',
        description: 'Diseño e implementación de interfaces accesibles, mantenimiento de componentes reutilizables y mejora de performance.'
      },
      {
        period: '2022 - 2024',
        title: 'Desarrollador Web - Empresa Y',
        description: 'Desarrollo de sitios corporativos y e-commerce con integraciones API, SEO técnico y mejoras de conversión.'
      }
    ],
    projects: [
      {
        title: 'Dashboard Operativo',
        description: 'Aplicación interna para seguimiento de métricas y visualización de objetivos en tiempo real.',
        stack: 'TypeScript, API REST, Charts'
      },
      {
        title: 'Landing de Conversión',
        description: 'Sitio orientado a captación de leads con estrategia UX y tests de performance.',
        stack: 'HTML, CSS, JavaScript'
      },
      {
        title: 'Portal de Clientes',
        description: 'Portal con autenticación y sección autogestión para reducir consultas manuales.',
        stack: 'React, Node API'
      }
    ]
  });
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile('./index.html', { root: '.' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor running en http://localhost:${PORT}`);
  console.log(`📄 CV disponible en http://localhost:${PORT}`);
});

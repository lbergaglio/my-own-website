// UMD: expone el modelo tanto para navegador como para Node (API server).
(function (root, factory) {
  const model = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = model;
  }

  if (root) {
    root.CV_CONTENT_MODEL = model;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  // Estructura base del CV. Se usa como fallback y como plantilla de restauracion.
  const defaultContent = {
    name: 'Tu Nombre',
    role: 'Desarrollador Web Frontend',
    badge: 'Disponible para nuevas oportunidades',
    summary:
      'Construyo experiencias web de alto impacto, enfocadas en usabilidad, rendimiento y resultados de negocio.',
    about:
      'Perfil proactivo y orientado a resultados. Experiencia en interfaces modernas, colaboracion con equipos producto y optimizacion continua de procesos digitales.',
    location: 'Ciudad, Pais',
    email: 'tunombre@email.com',
    phone: '+54 9 11 0000 0000',
    languages: 'Espanol nativo, Ingles intermedio',
    social: {
      linkedin: 'https://www.linkedin.com/in/luciano-bergaglio-a9001b172/',
      github: 'https://github.com/lbergaglio',
      portfolio: '',
      twitter: '',
    },
    contactMessage:
      'Si te interesa mi perfil para una posicion o proyecto, estare encantado de conversar.',
    skills: [
      'HTML5',
      'CSS3',
      'JavaScript',
      'TypeScript',
      'React',
      'Git',
      'Responsive Design',
      'UI Systems',
    ],
    certifications: [],
    experience: [
      {
        period: '2024 - Actualidad',
        title: 'Desarrollador Frontend - Empresa X',
        description:
          'Diseno e implementacion de interfaces accesibles, mantenimiento de componentes reutilizables y mejora de performance.',
      },
      {
        period: '2022 - 2024',
        title: 'Desarrollador Web - Empresa Y',
        description:
          'Desarrollo de sitios corporativos y e-commerce con integraciones API, SEO tecnico y mejoras de conversion.',
      },
    ],
    projects: [
      {
        title: 'Dashboard Operativo',
        description:
          'Aplicacion interna para seguimiento de metricas y visualizacion de objetivos en tiempo real.',
        stack: 'TypeScript, API REST, Charts',
      },
      {
        title: 'Landing de Conversion',
        description:
          'Sitio orientado a captacion de leads con estrategia UX y tests de performance.',
        stack: 'HTML, CSS, JavaScript',
      },
      {
        title: 'Portal de Clientes',
        description:
          'Portal con autenticacion y seccion autogestion para reducir consultas manuales.',
        stack: 'React, Node API',
      },
    ],
  };

  // Asegura shape estable y limpia valores invalidos antes de renderizar/persistir.
  function normalizeContent(input) {
    const source = isPlainObject(input) ? input : {};

    const merged = {
      ...defaultContent,
      ...source,
      social: {
        ...defaultContent.social,
        ...(isPlainObject(source.social) ? source.social : {}),
      },
    };

    merged.name = cleanString(source.name, defaultContent.name);
    merged.role = cleanString(source.role, defaultContent.role);
    merged.badge = cleanString(source.badge, defaultContent.badge);
    merged.summary = cleanString(source.summary, defaultContent.summary);
    merged.about = cleanString(source.about, defaultContent.about);
    merged.location = cleanString(source.location, defaultContent.location);
    merged.email = cleanString(source.email, defaultContent.email);
    merged.phone = cleanString(source.phone, defaultContent.phone);
    merged.languages = cleanString(source.languages, defaultContent.languages);
    merged.contactMessage = cleanString(source.contactMessage, defaultContent.contactMessage);

    merged.skills = Array.isArray(source.skills)
      ? source.skills.map((item) => cleanString(item)).filter(Boolean)
      : [...defaultContent.skills];

    merged.certifications = Array.isArray(source.certifications)
      ? source.certifications
          .map((item) => ({
            name: cleanString(item?.name),
            issuer: cleanString(item?.issuer),
            year: cleanString(item?.year),
            percentage: clampPercentage(item?.percentage ?? 100),
          }))
          .filter((item) => item.name && item.issuer && item.year)
      : [...defaultContent.certifications];

    merged.experience = Array.isArray(source.experience)
      ? source.experience
          .map((item) => ({
            period: cleanString(item?.period),
            title: cleanString(item?.title),
            description: cleanString(item?.description),
          }))
          .filter((item) => item.period && item.title && item.description)
      : [...defaultContent.experience];

    merged.projects = Array.isArray(source.projects)
      ? source.projects
          .map((item) => ({
            title: cleanString(item?.title),
            description: cleanString(item?.description),
            stack: cleanString(item?.stack),
          }))
          .filter((item) => item.title && item.description && item.stack)
      : [...defaultContent.projects];

    return merged;
  }

  // Normaliza strings removiendo espacios y aplicando fallback cuando queda vacio.
  function cleanString(value, fallback = '') {
    const text = String(value ?? '').trim();
    return text.length > 0 ? text : fallback;
  }

  // Limita porcentaje a un rango utilizable en UI.
  function clampPercentage(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  // Verifica objetos "plain" para evitar arrays u otros tipos no esperados.
  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  // API publica del modulo.
  return {
    defaultContent,
    normalizeContent,
  };
});
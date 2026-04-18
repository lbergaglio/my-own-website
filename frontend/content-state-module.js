export function create(deps) {
  const {
    admin,
    storageKey,
    apiEndpoint,
    defaultContent,
    normalizeContent,
    parsePipeLines,
    buildAuthHeaders,
  } = deps;

  function loadCachedContent() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    try {
      return normalizeContent(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  }

  async function fetchRemoteContent() {
    const response = await fetch(apiEndpoint, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error('Failed to load content from API');
    }

    return normalizeContent(await response.json());
  }

  async function loadContent() {
    try {
      const remoteContent = await fetchRemoteContent();
      localStorage.setItem(storageKey, JSON.stringify(remoteContent));
      return remoteContent;
    } catch (error) {
      return loadCachedContent() || structuredClone(defaultContent);
    }
  }

  async function saveContent(nextContent) {
    const response = await fetch(apiEndpoint, {
      method: 'PUT',
      headers: await buildAuthHeaders(),
      body: JSON.stringify(normalizeContent(nextContent)),
    });

    if (!response.ok) {
      const errorData = await readErrorResponse(response);
      throw new Error(errorData.error || 'No se pudo guardar el contenido.');
    }

    const saved = normalizeContent(await response.json());
    localStorage.setItem(storageKey, JSON.stringify(saved));
    return saved;
  }

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

  async function readErrorResponse(response) {
    const status = Number(response?.status || 0);

    try {
      const payload = await response.json();
      if (payload && typeof payload.error === 'string') {
        return payload;
      }

      if (payload && payload.error && typeof payload.error.message === 'string') {
        return { error: payload.error.message };
      }

      return { error: `Error del servidor (${status || 'desconocido'})` };
    } catch (error) {
      try {
        const text = String(await response.text()).trim();
        if (text) {
          return { error: `Error del servidor (${status || 'desconocido'}): ${text.slice(0, 180)}` };
        }
      } catch (innerError) {
        // Ignore text parsing errors and return generic fallback.
      }

      return { error: `Respuesta invalida del servidor (${status || 'desconocido'})` };
    }
  }

  return {
    loadCachedContent,
    fetchRemoteContent,
    loadContent,
    saveContent,
    collectFormData,
  };
}
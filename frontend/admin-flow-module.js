// Admin Flow Module: Encapsula toda la lógica de administración, formularios y manejo de auth.
// Responsabilidades:
//   - Event binding para panel admin (abrir, cerrar, logout)
//   - Guardado de contenido con validación y feedback
//   - Reset de contenido a valores por defecto
//   - Upload/download de archivos JSON
//   - Integración con ATS Panel
//   - Control visual del modal de auth

export function create(deps) {
  const {
    admin,
    authApi,
    contentStateApi,
    atsPanelApi,
    renderApi,
    cvContentRef, // { current: cvContent } para acceso en closure
    defaultContent,
    normalizeContent,
    storageKey,
    uiText,
    buildAuthHeaders,
    alertText,
    getCurrentLocale,
    refreshATSAnalysisPreview,
  } = deps;

  // Controladores privados de panel y modal
  function openAdminPanel() {
    admin.panel.classList.add('open');
    admin.panel.setAttribute('aria-hidden', 'false');
  }

  function closeAdminPanel() {
    admin.panel.classList.remove('open');
    admin.panel.setAttribute('aria-hidden', 'true');
  }

  function openAuthModal() {
    admin.authModal.classList.add('open');
    admin.authModal.setAttribute('aria-hidden', 'false');
    admin.authError.textContent = '';

    if (!authApi.isConfigured()) {
      admin.authError.textContent = 'Auth0 no esta configurado. Edita AUTH0_CONFIG en script.js.';
      return;
    }

    admin.authLoginBtn.focus();
  }

  function closeAuthModal() {
    admin.authModal.classList.remove('open');
    admin.authModal.setAttribute('aria-hidden', 'true');
  }

  // Guarda cambios del formulario con validación y feedback.
  async function saveSubmittedContent() {
    const next = contentStateApi.collectFormData();
    if (!next) {
      alertText(
        'Revisa el formato de Certificaciones, Experiencia y Proyectos. Usa: campo | campo | campo'
      );
      return;
    }

    try {
      const saved = await contentStateApi.saveContent(next);
      cvContentRef.current = saved;
      renderApi.render(saved);
      renderApi.populateForm(saved);
      alertText('Contenido guardado en el CMS.');
    } catch (error) {
      alertText(error.message || 'No se pudo guardar el contenido.');
    }
  }

  // Restaura contenido por defecto y lo persiste remotamente.
  async function resetContent() {
    try {
      const saved = await contentStateApi.saveContent(structuredClone(defaultContent));
      cvContentRef.current = saved;
      renderApi.render(saved);
      renderApi.populateForm(saved);
      localStorage.removeItem(storageKey);
      alertText('Contenido restaurado y guardado.');
    } catch (error) {
      alertText(error.message || 'No se pudo restaurar el contenido.');
    }
  }

  // Descarga el contenido actual como archivo JSON.
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(cvContentRef.current, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv-content.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Carga contenido desde archivo JSON.
  async function uploadJSON(file) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      cvContentRef.current = normalizeContent(parsed);
      localStorage.setItem(storageKey, JSON.stringify(cvContentRef.current));
      renderApi.render(cvContentRef.current);
      renderApi.populateForm(cvContentRef.current);
      alertText('JSON cargado correctamente.');
    } catch (error) {
      alertText('El archivo JSON no es valido.');
    }
  }

  // Acceso al análisis ATS (delegado a atsPanelApi).
  function getATSJobDescription() {
    return atsPanelApi.getJobDescription();
  }

  // Aplica sugerencias ATS al summary.
  function applyATSSuggestionsToSummary() {
    atsPanelApi.applySuggestionsToSummary();
  }

  // Refresca preview del análisis ATS.
  function refreshATS() {
    if (atsPanelApi && typeof atsPanelApi.refresh === 'function') {
      atsPanelApi.refresh();
    } else if (typeof refreshATSAnalysisPreview === 'function') {
      refreshATSAnalysisPreview();
    }
  }

  // Vincula todos los event listeners del panel admin.
  function bind() {
    // Botón de abrir admin
    admin.openBtn.addEventListener('click', async () => {
      if (await authApi.isAuthenticated()) {
        openAdminPanel();
        return;
      }

      openAuthModal();
    });

    // Botón de cerrar admin
    admin.closeBtn.addEventListener('click', () => {
      closeAdminPanel();
    });

    // Botón de logout
    admin.logoutBtn.addEventListener('click', () => {
      void authApi.logoutAuth0();
    });

    // Cancelar auth modal
    admin.authCancel.addEventListener('click', () => {
      closeAuthModal();
    });

    // Envío del formulario de auth
    admin.authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await authApi.loginAuth0();
    });

    // Envío del formulario admin (guardar contenido)
    admin.form.addEventListener('submit', (event) => {
      event.preventDefault();
      void saveSubmittedContent();
    });

    // Botón de reset
    admin.resetBtn.addEventListener('click', () => {
      void resetContent();
    });

    // Botón de descargar JSON
    admin.downloadBtn.addEventListener('click', () => {
      downloadJSON();
    });

    // Input de carga de JSON
    admin.uploadInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      await uploadJSON(file);
      admin.uploadInput.value = '';
    });

    // Bind ATS Panel si está disponible
    if (atsPanelApi && typeof atsPanelApi.bind === 'function') {
      atsPanelApi.bind();
    } else {
      refreshATS();
    }
  }

  // API pública
  return {
    bind,
    openAdminPanel,
    closeAdminPanel,
    openAuthModal,
    closeAuthModal,
    saveSubmittedContent,
    resetContent,
    downloadJSON,
    uploadJSON,
    getATSJobDescription,
    applyATSSuggestionsToSummary,
    refreshATS,
  };
}

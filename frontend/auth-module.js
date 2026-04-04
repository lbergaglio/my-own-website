export function create(deps) {
  const {
    admin,
    auth0Config,
    auth0RedirectUri,
    auth0Scope,
    auth0Connection,
    authIntentKey,
    getAuthClientPromise,
    onOpenAdminPanel,
    onCloseAdminPanel,
    onCloseAuthModal,
    onOpenAuthModal,
  } = deps;

  function getAuthErrorMessage(error) {
      const message = String(error?.message || error?.error_description || '').toLowerCase();
      if (message.includes('callback url mismatch') || message.includes('redirect_uri')) {
        return 'Error de callback en Auth0. Revisa Allowed Callback URLs.';
      }

      if (message.includes('access_denied')) {
        return 'Acceso denegado por Auth0 o por la conexion social configurada.';
      }

      return 'No se pudo iniciar sesion con Auth0.';
    }

  function isConfigured() {
      return (
        auth0Config.domain
        && auth0Config.domain !== 'REEMPLAZAR_TU_DOMINIO.auth0.com'
        && auth0Config.clientId
        && auth0Config.clientId !== 'REEMPLAZAR_CLIENT_ID'
      );
    }

  async function createAuth0ClientInstance() {
    if (!globalThis.auth0 || !isConfigured()) {
      return null;
    }

    const client = await globalThis.auth0.createAuth0Client({
        domain: auth0Config.domain,
        clientId: auth0Config.clientId,
        authorizationParams: {
          redirect_uri: auth0RedirectUri,
          scope: auth0Scope,
          audience: auth0Config.audience || undefined,
        },
        cacheLocation: 'localstorage',
      });

    return client;
  }

  async function initializeAuthFlow() {
      const client = await getAuthClientPromise();
      if (!client) {
        return;
      }

    const search = new URLSearchParams(window.location.search);
      const hasAuthParams = search.has('code') && search.has('state');

      if (hasAuthParams) {
        try {
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          admin.authError.textContent = getAuthErrorMessage(error);
        }
      }

      const shouldOpenAdmin = sessionStorage.getItem(authIntentKey) === 'open-admin';
      if (shouldOpenAdmin && (await client.isAuthenticated())) {
        sessionStorage.removeItem(authIntentKey);
        onCloseAuthModal();
        onOpenAdminPanel();
      }
    }

  async function isAuthenticated() {
      const client = await getAuthClientPromise();
      if (!client) {
        return false;
      }

      try {
        return await client.isAuthenticated();
      } catch (error) {
        return false;
      }
    }

  async function loginAuth0() {
      admin.authError.textContent = '';

      const client = await getAuthClientPromise();
      if (!client) {
        admin.authError.textContent = 'Auth0 no esta configurado. Edita AUTH0_CONFIG en script.js.';
        return;
      }

      try {
        const authorizationParams = {
          redirect_uri: auth0RedirectUri,
          scope: auth0Scope,
          audience: auth0Config.audience || undefined,
          connection: auth0Connection || undefined,
        };

        await client.loginWithPopup({ authorizationParams });

        if (await client.isAuthenticated()) {
          onCloseAuthModal();
          onOpenAdminPanel();
        }
      } catch (error) {
        const errorCode = error?.error || error?.code || '';
        if (errorCode.includes('popup')) {
          sessionStorage.setItem(authIntentKey, 'open-admin');
          await client.loginWithRedirect({
            authorizationParams: {
              redirect_uri: auth0RedirectUri,
              scope: auth0Scope,
              audience: auth0Config.audience || undefined,
              connection: auth0Connection || undefined,
            },
          });
          return;
        }

        admin.authError.textContent = getAuthErrorMessage(error);
      }
    }

  async function logoutAuth0() {
      onCloseAdminPanel();

      const client = await getAuthClientPromise();
      if (!client) {
        alert('Sesion cerrada.');
        return;
      }

      await client.logout({ openUrl: false });
      alert('Sesion cerrada.');
    }

  return {
    createAuth0ClientInstance,
    initializeAuthFlow,
    isAuthenticated,
    loginAuth0,
    logoutAuth0,
    getAuthErrorMessage,
    isConfigured,
    onOpenAuthModal,
  };
}

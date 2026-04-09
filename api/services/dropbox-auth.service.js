/**
 * DropboxAuthService
 * Obtiene access tokens usando OAuth2 refresh_token.
 * refresh_token, client_id y client_secret se leen de variables de entorno.
 * access_token NUNCA se almacena en .env.
 */

const axios = require('axios');

const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Renovar 5 min antes de expirar

let tokenState = {
  accessToken: null,
  expiresAt: null,
  isRefreshing: false,
  refreshPromise: null
};

/**
 * Obtiene un access token válido.
 * Renueva automáticamente si está expirado o próximo a expirar.
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    const missing = [];
    if (!refreshToken) missing.push('DROPBOX_REFRESH_TOKEN');
    if (!clientId) missing.push('DROPBOX_APP_KEY');
    if (!clientSecret) missing.push('DROPBOX_APP_SECRET');
    throw new Error(
      `Dropbox OAuth2 no configurado. Faltan en variables.env: ${missing.join(', ')}. ` +
      'Nunca guardes access_token en .env; usa refresh_token.'
    );
  }

  // Si ya hay un refresh en curso, esperar a que termine
  if (tokenState.isRefreshing && tokenState.refreshPromise) {
    return tokenState.refreshPromise;
  }

  const now = Date.now();
  const stillValid =
    tokenState.accessToken &&
    tokenState.expiresAt &&
    tokenState.expiresAt - now > TOKEN_EXPIRY_BUFFER_MS;

  if (stillValid) {
    return tokenState.accessToken;
  }

  tokenState.isRefreshing = true;
  tokenState.refreshPromise = refreshAccessToken(refreshToken, clientId, clientSecret)
    .then((accessToken) => {
      tokenState.isRefreshing = false;
      tokenState.refreshPromise = null;
      return accessToken;
    })
    .catch((err) => {
      tokenState.isRefreshing = false;
      tokenState.refreshPromise = null;
      throw err;
    });

  return tokenState.refreshPromise;
}

/**
 * Intercambia refresh_token por access_token.
 * @private
 */
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  try {
    console.log('🔄 Dropbox: renovando access token con refresh_token...');

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    });

    const { data, status } = await axios.post(TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      validateStatus: (s) => s < 500
    });

    if (status !== 200 || data.error) {
      const msg = data.error_description || data.error || 'Error renovando token';
      console.error('❌ Dropbox token refresh failed:', msg);
      throw new Error(msg);
    }

    const expiresIn = data.expires_in || 14400; // 4h por defecto
    tokenState.accessToken = data.access_token;
    tokenState.expiresAt = Date.now() + expiresIn * 1000;

    console.log(`✅ Dropbox: access token renovado (válido ~${Math.round(expiresIn / 60)} min)`);
    return data.access_token;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      const msg = body?.error_description || body?.error || err.message;
      console.error('❌ Dropbox token refresh error:', status, msg);
      throw new Error(msg || `Dropbox token refresh failed (${status})`);
    }
    throw err;
  }
}

/**
 * Estado del token (para logs/admin). No expone el token completo.
 */
function getTokenState() {
  return {
    hasAccessToken: !!tokenState.accessToken,
    expiresAt: tokenState.expiresAt || null,
    isRefreshing: tokenState.isRefreshing,
    hasRefreshToken: !!process.env.DROPBOX_REFRESH_TOKEN
  };
}

/**
 * Invalida el token en memoria (útil para forzar renovación en tests).
 */
function invalidateToken() {
  tokenState.accessToken = null;
  tokenState.expiresAt = null;
  console.log('🔄 Dropbox: token invalidado en memoria');
}

module.exports = {
  getAccessToken,
  getTokenState,
  invalidateToken
};

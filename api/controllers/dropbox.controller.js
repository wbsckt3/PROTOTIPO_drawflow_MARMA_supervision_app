/**
 * Controlador Dropbox
 * Estado del token OAuth2 (refresh_token en .env; access_token nunca en .env).
 */

const { getTokenState, isDropboxConfigured } = require('../services/dropbox.service');

/**
 * GET /api/tenant/dropbox/token-status
 * Estado del token (hasAccessToken, expiresAt, isRefreshing, hasRefreshToken).
 */
exports.getDropboxTokenStatus = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    if (!userEmail) {
      return res.status(400).json({ error: 'Falta header x-user-email' });
    }

    const configured = isDropboxConfigured();
    const state = getTokenState();

    let timeToExpirySeconds = null;
    if (state.expiresAt) {
      timeToExpirySeconds = Math.max(0, Math.round((state.expiresAt - Date.now()) / 1000));
    }

    return res.status(200).json({
      success: true,
      data: {
        configured,
        hasAccessToken: state.hasAccessToken,
        hasRefreshToken: state.hasRefreshToken,
        isRefreshing: state.isRefreshing,
        expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
        timeToExpirySeconds
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado del token Dropbox:', error);
    return res.status(500).json({
      error: 'Error obteniendo estado del token',
      details: error.message
    });
  }
};

module.exports = {
  getDropboxTokenStatus
};

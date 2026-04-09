/**
 * DropboxUploadService
 * Sube archivos a Dropbox usando OAuth2 access token (obtenido vía DropboxAuthService).
 * Usa Dropbox API v2: /files/upload (content) y /sharing/create_shared_link_with_settings.
 */

const axios = require('axios');
const { getAccessToken } = require('./dropbox-auth.service');

const CONTENT_BASE = 'https://content.dropboxapi.com/2';
const API_BASE = 'https://api.dropboxapi.com/2';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Obtiene la carpeta de la app desde env (ej: OrbixApi).
 * @returns {string}
 */
function getAppFolder() {
  const folder = process.env.DROPBOX_APP_FOLDER || 'OrbixApi';
  return folder.startsWith('/') ? folder : `/${folder}`;
}

/**
 * Asegura que la carpeta de la app existe en Dropbox.
 * @param {string} accessToken
 * @private
 */
async function ensureAppFolderExists(accessToken) {
  const folderPath = getAppFolder();

  // RPC en api.dropboxapi.com: parámetros en el BODY JSON, no en header Dropbox-API-Arg
  const metaRes = await axios.post(
    `${API_BASE}/files/get_metadata`,
    { path: folderPath },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      validateStatus: (s) => s === 200 || s === 409
    }
  );

  if (metaRes.status === 200) return;

  try {
    await axios.post(
      `${API_BASE}/files/create_folder_v2`,
      { path: folderPath, autorename: false },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: (s) => s === 200 || s === 409
      }
    );
    console.log(`✅ Dropbox: carpeta ${folderPath} creada`);
  } catch (createErr) {
    if (axios.isAxiosError(createErr)) {
      const status = createErr.response?.status;
      if (status === 429) {
        console.warn('⚠️ Dropbox: 429 al crear carpeta, se intentará subir de todas formas');
        return;
      }
      if (status === 409) return;
    }
    throw createErr;
  }
}

/**
 * Sube un buffer a Dropbox y opcionalmente crea link compartido.
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} dropboxPath - Ruta en Dropbox (ej: /OrbixApi/foto_2024-01-01.jpg)
 * @param {string} accessToken - Token obtenido con getAccessToken()
 * @returns {Promise<string>} URL directa del archivo (o path si falla el link)
 */
async function uploadFile(fileBuffer, dropboxPath, accessToken) {
  // Dropbox API v2: mode debe ser objeto con .tag (WriteMode)
  const arg = {
    path: dropboxPath,
    mode: { '.tag': 'add' },
    autorename: true
  };

  let response;
  try {
    response = await axios.post(
      `${CONTENT_BASE}/files/upload`,
      fileBuffer,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify(arg)
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
        validateStatus: () => true
      }
    );
  } catch (err) {
    const body = err.response?.data;
    const msg = body?.error_summary || body?.error?.message || err.message;
    console.error('❌ Dropbox upload error (raw):', body || err.message);
    throw new Error(msg || `Upload failed: ${err.message}`);
  }

  const { data, status } = response;
  if (status !== 200) {
    const summary = data?.error_summary || data?.error?.message || data?.error || `Upload failed ${status}`;
    const full = JSON.stringify(data || { status });
    console.error('❌ Dropbox upload error:', summary);
    console.error('❌ Dropbox response body:', full);
    const err = new Error(`Dropbox ${status}: ${summary}`);
    err.response = { status, data };
    throw err;
  }

  let directLink = dropboxPath;
  try {
    const shareRes = await axios.post(
      `${API_BASE}/sharing/create_shared_link_with_settings`,
      { path: dropboxPath, settings: { requested_visibility: { '.tag': 'public' } } },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    const url = shareRes.data?.url;
    if (url) {
      directLink = url
        .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
        .replace('?dl=0', '');
    }
  } catch (shareErr) {
    console.warn('⚠️ Dropbox: no se pudo crear link compartido, usando path:', dropboxPath);
  }

  return directLink;
}

/**
 * Sube una imagen (base64) a Dropbox.
 * Obtiene access token antes de subir; maneja reintentos por 429.
 * @param {string} base64Image - Imagen en base64 (con o sin prefijo data:image/...;base64,)
 * @param {string} fileName - Nombre base del archivo (sin extensión)
 * @param {object} [metadata] - Opcional: geolocation, timestamp, etc.
 * @returns {Promise<string>} URL de la imagen en Dropbox
 */
async function uploadImage(base64Image, fileName, metadata = {}) {
  const accessToken = await getAccessToken();
  await ensureAppFolderExists(accessToken);

  const raw = typeof base64Image === 'string' ? base64Image : (base64Image?.image || base64Image?.data || '');
  if (!raw || typeof raw !== 'string') {
    throw new Error('uploadImage: se esperaba base64 (string) o objeto con .image');
  }
  const base64Data = raw.replace(/^data:image\/\w+;base64,/, '').trim();
  const fileBuffer = Buffer.from(base64Data, 'base64');
  if (fileBuffer.length === 0) {
    throw new Error('uploadImage: el contenido en base64 está vacío o no es válido');
  }

  const folderPath = getAppFolder().replace(/\/$/, '');
  const sanitized = String(fileName).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'file';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dropboxPath = `${folderPath}/${sanitized}_${timestamp}.jpg`.replace(/\/+/g, '/');

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = await uploadFile(fileBuffer, dropboxPath, accessToken);
      if (metadata && Object.keys(metadata).length > 0) {
        const metaPath = dropboxPath.replace('.jpg', '_metadata.json');
        const metaBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
        try {
          await uploadFile(metaBuffer, metaPath, accessToken);
        } catch (e) {
          console.warn('⚠️ Dropbox: no se guardaron metadatos:', e.message);
        }
      }
      return url;
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status === 429 && attempt < MAX_RETRIES - 1) {
        const delay = (err.response?.headers?.['retry-after'] || RETRY_DELAY_MS / 1000) * 1000;
        console.warn(`⚠️ Dropbox 429, reintento en ${delay / 1000}s (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (status === 401 || err.response?.data?.error?.['.tag'] === 'expired_access_token') {
        const { invalidateToken } = require('./dropbox-auth.service');
        invalidateToken();
        throw new Error('Token de Dropbox expirado. Se renovará en la siguiente petición.');
      }
      throw err;
    }
  }
  throw lastError;
}

module.exports = {
  getAppFolder,
  ensureAppFolderExists,
  uploadFile,
  uploadImage
};

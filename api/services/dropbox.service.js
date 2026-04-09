/**
 * Dropbox Service
 * Orquesta subida de evidencias (fotos) a Dropbox usando OAuth2 refresh_token.
 * - Access token se obtiene dinámicamente vía DropboxAuthService (nunca en .env).
 * - Subida real vía DropboxUploadService (API v2, axios).
 * Variables de entorno requeridas: DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_APP_FOLDER.
 */

const { getAccessToken, getTokenState } = require('./dropbox-auth.service');
const { uploadImage: uploadImageToDropboxApi, getAppFolder } = require('./dropbox-upload.service');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const WATERMARK_TEXT = 'Powered by Orbix';

function getWatermarkLogoPath() {
  const explicitPath = process.env.WATERMARK_LOGO_PATH;
  if (explicitPath && fs.existsSync(explicitPath)) return explicitPath;

  const candidates = [
    path.resolve(process.cwd(), 'logo_marma_nuevo.jpg'),
    path.resolve(process.cwd(), 'logo_marma_nuevo.jpeg'),
    path.resolve(process.cwd(), 'logo_marma_nuevo.png')
  ];

  return candidates.find((p) => fs.existsSync(p)) || null;
}

async function applyWatermarkToImage(base64Image) {
  try {
    if (typeof base64Image !== 'string' || base64Image.length === 0) return base64Image;

    const prefixMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mime = prefixMatch ? prefixMatch[1] : 'image/jpeg';
    const rawBase64 = prefixMatch ? base64Image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '') : base64Image;
    const inputBuffer = Buffer.from(rawBase64, 'base64');

    const image = sharp(inputBuffer);
    const meta = await image.metadata();
    const width = Math.max(meta.width || 1200, 600);
    const height = Math.max(meta.height || 900, 450);

    const overlayWidth = Math.round(width * 0.28);
    const overlayHeight = Math.round(height * 0.14);
    const textSvg = Buffer.from(`
      <svg width="${overlayWidth}" height="${overlayHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${overlayWidth}" height="${overlayHeight}" rx="12" ry="12" fill="rgba(15,23,42,0.38)"/>
        <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
          font-family="Segoe UI, Arial, sans-serif" font-size="${Math.max(18, Math.round(width * 0.02))}"
          font-weight="700" fill="rgba(255,255,255,0.95)">${WATERMARK_TEXT}</text>
      </svg>
    `);

    const composites = [{
      input: textSvg,
      gravity: 'southeast'
    }];

    const logoPath = getWatermarkLogoPath();
    if (logoPath) {
      const logoBuffer = await sharp(logoPath)
        .resize({ width: Math.round(width * 0.13), fit: 'inside' })
        .png()
        .toBuffer();

      composites.push({
        input: logoBuffer,
        gravity: 'southeast',
        top: Math.round(height * 0.015),
        left: Math.round(width * 0.015)
      });
    }

    const outBuffer = await image
      .composite(composites)
      .jpeg({ quality: 88 })
      .toBuffer();

    return `data:${mime};base64,${outBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('⚠️ No se pudo aplicar marca de agua, se usa imagen original:', error.message);
    return base64Image;
  }
}

/**
 * Comprueba si Dropbox está configurado (refresh token y credenciales en env).
 */
function isDropboxConfigured() {
  return !!(
    process.env.DROPBOX_REFRESH_TOKEN &&
    process.env.DROPBOX_APP_KEY &&
    process.env.DROPBOX_APP_SECRET
  );
}

/**
 * Inicializa/valida Dropbox obteniendo un access token.
 * Útil al arranque del servidor para detectar config incorrecta.
 */
async function initializeDropbox() {
  if (!isDropboxConfigured()) {
    throw new Error(
      'Dropbox no configurado. Define DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY y DROPBOX_APP_SECRET en variables.env. ' +
      'No guardes access_token en .env.'
    );
  }
  await getAccessToken();
  console.log('✅ Dropbox inicializado (OAuth2 refresh_token). Carpeta:', getAppFolder());
}

/**
 * Sube una imagen (base64) a Dropbox y devuelve la URL.
 * Usa getAccessToken() antes de subir; maneja 429 y token expirado.
 * @param {string} base64Image
 * @param {string} fileName
 * @param {object} [metadata]
 * @returns {Promise<string>} URL de la imagen
 */
async function uploadImageToDropbox(base64Image, fileName, metadata = {}) {
  if (!isDropboxConfigured()) {
    throw new Error(
      'DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY y DROPBOX_APP_SECRET deben estar en variables.env.'
    );
  }
  const watermarkedImage = await applyWatermarkToImage(base64Image);
  return uploadImageToDropboxApi(watermarkedImage, fileName, metadata);
}

/**
 * Verifica que la carpeta de la app exista (la subida ya lo hace; se mantiene por compatibilidad).
 */
async function ensureAppFolderExists() {
  if (!isDropboxConfigured()) return;
  const { ensureAppFolderExists: ensureFolder } = require('./dropbox-upload.service');
  const token = await getAccessToken();
  await ensureFolder(token);
}

/**
 * Procesa evidencias (por área/item): sube imágenes a Dropbox y reemplaza base64 por URL.
 * @param {object} evidencias - { areaKey: { itemName: { image, geolocation } | string } }
 * @returns {Promise<object>} evidencias con URLs en lugar de base64
 */
async function processEvidenciasToDropbox(evidencias) {
  if (!evidencias || typeof evidencias !== 'object') return evidencias;

  if (!isDropboxConfigured()) {
    console.warn('⚠️ Dropbox no configurado (DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET). No se subirán evidencias.');
    throw new Error(
      'Dropbox no configurado. Configura DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY y DROPBOX_APP_SECRET en variables.env.'
    );
  }

  const processedEvidencias = {};
  const uploadPromises = [];

  for (const [areaKey, areaEvidencias] of Object.entries(evidencias)) {
    if (!areaEvidencias || typeof areaEvidencias !== 'object') {
      processedEvidencias[areaKey] = areaEvidencias;
      continue;
    }
    processedEvidencias[areaKey] = {};

    for (const [itemName, evidenciaData] of Object.entries(areaEvidencias)) {
      if (!evidenciaData) {
        processedEvidencias[areaKey][itemName] = evidenciaData;
        continue;
      }

      // Nuevo: evidencia con { fotos: [...] }
      if (
        typeof evidenciaData === 'object' &&
        evidenciaData !== null &&
        Array.isArray(evidenciaData.fotos)
      ) {
        const fotosResult = new Array(evidenciaData.fotos.length).fill(null)
        processedEvidencias[areaKey][itemName] = { fotos: fotosResult }

        evidenciaData.fotos.forEach((foto, idx) => {
          if (!foto) return

          // Soportar foto como string (base64/url) o como objeto { image/url, geolocation, timestamp }
          const isObj = typeof foto === 'object' && foto !== null
          const imageValue = isObj ? (foto.image ?? foto.url ?? null) : foto

          const geolocation = isObj ? (foto.geolocation || null) : null
          const timestamp = isObj ? (foto.timestamp || new Date().toISOString()) : new Date().toISOString()

          if (typeof imageValue === 'string' && (imageValue.startsWith('http://') || imageValue.startsWith('https://'))) {
            fotosResult[idx] = { url: imageValue, geolocation, timestamp }
            return
          }

          const isBase64 =
            typeof imageValue === 'string' &&
            (imageValue.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(imageValue.replace(/^data:image\/\w+;base64,/, '').trim()))

          if (isBase64) {
            const fileName = `${areaKey}_${itemName}_foto${idx}`.replace(/[^a-zA-Z0-9_-]/g, '_')
            uploadPromises.push(
              (async () => {
                const watermarked = await applyWatermarkToImage(imageValue)
                const url = await uploadImageToDropboxApi(watermarked, fileName, {
                  geolocation,
                  timestamp,
                  area: areaKey,
                  item: itemName,
                  photoIndex: idx
                })
                fotosResult[idx] = { url, geolocation, timestamp }
                console.log(`✅ Evidencia ${areaKey}/${itemName} foto ${idx} subida a Dropbox`)
              })().catch((err) => {
                console.error(`❌ Error subiendo evidencia ${areaKey}/${itemName} foto ${idx}:`, err.message)
              })
            )
            return
          }

          // Si no es base64 ni URL, conservarlo tal cual (raro, pero mantiene compatibilidad)
          fotosResult[idx] = isObj ? foto : { url: imageValue, geolocation, timestamp }
        })

        continue
      }

      // Nuevo: evidencia como array directamente
      if (Array.isArray(evidenciaData)) {
        const fotosResult = new Array(evidenciaData.length).fill(null)
        processedEvidencias[areaKey][itemName] = { fotos: fotosResult }

        evidenciaData.forEach((foto, idx) => {
          if (!foto) return
          const isObj = typeof foto === 'object' && foto !== null
          const imageValue = isObj ? (foto.image ?? foto.url ?? null) : foto
          const geolocation = isObj ? (foto.geolocation || null) : null
          const timestamp = isObj ? (foto.timestamp || new Date().toISOString()) : new Date().toISOString()

          if (typeof imageValue === 'string' && (imageValue.startsWith('http://') || imageValue.startsWith('https://'))) {
            fotosResult[idx] = { url: imageValue, geolocation, timestamp }
            return
          }

          const isBase64 =
            typeof imageValue === 'string' &&
            (imageValue.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(imageValue.replace(/^data:image\/\w+;base64,/, '').trim()))

          if (isBase64) {
            const fileName = `${areaKey}_${itemName}_foto${idx}`.replace(/[^a-zA-Z0-9_-]/g, '_')
            uploadPromises.push(
              (async () => {
                const watermarked = await applyWatermarkToImage(imageValue)
                const url = await uploadImageToDropboxApi(watermarked, fileName, {
                  geolocation,
                  timestamp,
                  area: areaKey,
                  item: itemName,
                  photoIndex: idx
                })
                fotosResult[idx] = { url, geolocation, timestamp }
                console.log(`✅ Evidencia ${areaKey}/${itemName} foto ${idx} subida a Dropbox`)
              })().catch((err) => {
                console.error(`❌ Error subiendo evidencia ${areaKey}/${itemName} foto ${idx}:`, err.message)
              })
            )
            return
          }

          fotosResult[idx] = isObj ? foto : { url: imageValue, geolocation, timestamp }
        })

        continue
      }

      if (typeof evidenciaData === 'object' && (evidenciaData.image || evidenciaData.url)) {
        const imageValue = evidenciaData.image ?? evidenciaData.url;
        const isAlreadyUrl = typeof imageValue === 'string' && (imageValue.startsWith('http://') || imageValue.startsWith('https://'));
        if (isAlreadyUrl) {
          processedEvidencias[areaKey][itemName] = {
            url: imageValue,
            geolocation: evidenciaData.geolocation || null,
            timestamp: evidenciaData.timestamp || new Date().toISOString()
          };
          continue;
        }
        const isBase64 = typeof imageValue === 'string' && (imageValue.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(imageValue.replace(/^data:image\/\w+;base64,/, '').trim()));
        if (!isBase64) {
          processedEvidencias[areaKey][itemName] = evidenciaData;
          continue;
        }
        const metadata = {
          geolocation: evidenciaData.geolocation || null,
          timestamp: evidenciaData.timestamp || new Date().toISOString(),
          area: areaKey,
          item: itemName
        };
        const fileName = `${areaKey}_${itemName}`.replace(/[^a-zA-Z0-9_-]/g, '_');

        uploadPromises.push(
          (async () => {
            const watermarked = await applyWatermarkToImage(imageValue)
            const url = await uploadImageToDropboxApi(watermarked, fileName, metadata)
            processedEvidencias[areaKey][itemName] = {
              url,
              geolocation: metadata.geolocation,
              timestamp: metadata.timestamp
            };
            console.log(`✅ Evidencia ${areaKey}/${itemName} subida a Dropbox`);
          })().catch((err) => {
            console.error(`❌ Error subiendo evidencia ${areaKey}/${itemName}:`, err.message);
            if (err.response?.data) console.error('❌ Dropbox response:', JSON.stringify(err.response.data));
          })
        );
      } else if (typeof evidenciaData === 'string' && evidenciaData.startsWith('data:image')) {
        const fileName = `${areaKey}_${itemName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        uploadPromises.push(
          (async () => {
            const watermarked = await applyWatermarkToImage(evidenciaData)
            const url = await uploadImageToDropboxApi(watermarked, fileName, {
              area: areaKey,
              item: itemName,
              timestamp: new Date().toISOString()
            })
            processedEvidencias[areaKey][itemName] = {
              url,
              geolocation: null,
              timestamp: new Date().toISOString()
            };
            console.log(`✅ Evidencia ${areaKey}/${itemName} subida a Dropbox`);
          })().catch((err) => {
            console.error(`❌ Error subiendo evidencia ${areaKey}/${itemName}:`, err.message);
            if (err.response?.data) console.error('❌ Dropbox response:', JSON.stringify(err.response.data));
          })
        );
      } else if (typeof evidenciaData === 'string' && (evidenciaData.startsWith('http://') || evidenciaData.startsWith('https://'))) {
        processedEvidencias[areaKey][itemName] = {
          url: evidenciaData,
          geolocation: null,
          timestamp: new Date().toISOString()
        };
      } else {
        processedEvidencias[areaKey][itemName] = evidenciaData;
      }
    }
  }

  if (uploadPromises.length > 0) {
    const results = await Promise.allSettled(uploadPromises);
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`✅ Dropbox: ${successful} evidencias subidas${failed > 0 ? `, ${failed} fallidas` : ''}`);
    if (successful === 0 && failed > 0) {
      throw new Error('Todas las evidencias fallaron al subir a Dropbox. Revisa logs.');
    }
  }

  return processedEvidencias;
}

module.exports = {
  initializeDropbox,
  ensureAppFolderExists,
  uploadImageToDropbox,
  processEvidenciasToDropbox,
  getTokenState,
  isDropboxConfigured
};

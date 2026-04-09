# Dropbox OAuth2 (refresh token) – Uso

El backend sube evidencias (fotos) a Dropbox usando **solo** OAuth2 con **refresh_token**. El access_token **nunca** se guarda en `.env`; se obtiene en memoria con el refresh_token.

## Variables de entorno (variables.env)

```env
DROPBOX_APP_KEY=neih39pvu1hbqjs
DROPBOX_APP_SECRET=2y60zimtm6il3gi
DROPBOX_REFRESH_TOKEN=P8W9BvpVY1wAAAAAAAAAAajBuTCrA0xNzjFGAW9ACfgrq7D-t70tHc3G-NWRys7X
DROPBOX_APP_FOLDER=OrbixApi
```

- **Nunca** pongas `DROPBOX_ACCESS_TOKEN` (ni access_token estático) en `.env`.

## Servicios

- **DropboxAuthService** (`api/services/dropbox-auth.service.js`)
  - `getAccessToken()` – Devuelve un access_token válido (renueva con refresh_token si hace falta).
  - Lee `DROPBOX_REFRESH_TOKEN`, `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` de `process.env`.

- **DropboxUploadService** (`api/services/dropbox-upload.service.js`)
  - Llama a `getAccessToken()` antes de cada subida.
  - Sube con Dropbox API v2 `POST https://content.dropboxapi.com/2/files/upload` (axios).
  - Crea link compartido con `POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`.

- **dropbox.service.js** – Orquesta todo; el controlador de bitácoras solo usa `processEvidenciasToDropbox`.

## Ejemplo de uso desde controlador

```javascript
const { processEvidenciasToDropbox } = require('../services/dropbox.service');

// Dentro del handler de "llenar bitácora":
const evidencias = req.body.evidencias; // { areaKey: { itemName: { image: base64, geolocation } } }
const evidenciasProcesadas = await processEvidenciasToDropbox(evidencias);
// evidenciasProcesadas tendrá URLs de Dropbox en lugar de base64
```

## Ejemplo de uso directo (subir una imagen)

```javascript
const { uploadImageToDropbox } = require('./services/dropbox.service');

const base64Image = 'data:image/jpeg;base64,/9j/4AAQ...';
const fileName = 'piscinas_BANOS';
const metadata = { geolocation: { latitude: 6.22, longitude: -75.57 }, timestamp: new Date().toISOString() };

const url = await uploadImageToDropbox(base64Image, fileName, metadata);
console.log('URL en Dropbox:', url);
```

## Obtener refresh_token (una vez)

1. Abre en el navegador (sustituye `client_id` por tu App Key):
   ```
   https://www.dropbox.com/oauth2/authorize?client_id=TU_APP_KEY&response_type=code&token_access_type=offline&redirect_uri=http://localhost:3000/callback
   ```
2. Autoriza y copia el `code` de la URL de callback (`?code=...`).
3. POST a `https://api.dropboxapi.com/oauth2/token` con `application/x-www-form-urlencoded`:
   - `grant_type=authorization_code`
   - `code=...`
   - `client_id=...`
   - `client_secret=...`
   - `redirect_uri=http://localhost:3000/callback`
4. En la respuesta JSON usa el campo **refresh_token** y ponlo en `DROPBOX_REFRESH_TOKEN` en `variables.env`. No uses el `access_token` en `.env`.

## Estado del token (admin)

```javascript
const { getTokenState, isDropboxConfigured } = require('./services/dropbox.service');

const configured = isDropboxConfigured();
const state = getTokenState();
// state: { hasAccessToken, hasRefreshToken, isRefreshing, expiresAt }
```

GET `/api/tenant/dropbox/token-status` devuelve ese estado (y `timeToExpirySeconds`) para comprobar que Dropbox está configurado y el token se renueva bien.

# Integración de Dropbox para Fotografías de Bitácoras

## Resumen de Cambios

Se ha implementado la integración con Dropbox para almacenar las fotografías capturadas en las bitácoras de supervisión. Las imágenes ahora se suben a Dropbox y se guardan las URLs en MongoDB en lugar de almacenar el base64 completo.

## Archivos Modificados

### Backend

1. **`api/services/dropbox.service.js`** (NUEVO)
   - Servicio para subir imágenes a Dropbox
   - Convierte base64 a Buffer y sube a la carpeta de la app
   - Genera URLs compartidas públicas
   - Maneja metadatos (geolocalización, timestamp)

2. **`api/controllers/reglas-negocio.controller.js`**
   - Modificado `postLlenarBitacoraSupervision` para procesar evidencias antes de guardar
   - Sube imágenes a Dropbox automáticamente cuando se guarda una bitácora

3. **`variables.env`**
   - Agregada variable `DROPBOX_ACCESS_TOKEN` (debe configurarse)

4. **`package.json`** (en carpeta `api`)
   - Agregada dependencia `dropbox`

### Frontend

1. **`vue3_vite_local/src/views/BitacoraForm.vue`**
   - Actualizada función `getPhotoImage()` para manejar URLs de Dropbox
   - Actualizada función `generatePDF()` para cargar imágenes desde URLs
   - Actualizado mapeo de evidencias para soportar objetos con URLs

## Configuración Requerida

### 1. Obtener Access Token de Dropbox

1. Ve a https://www.dropbox.com/developers/apps
2. Busca o crea la app "orbix_test_app_api"
3. Genera un Access Token
4. Copia el token

### 2. Configurar en el Proyecto

Edita `variables.env` y agrega:
```
DROPBOX_ACCESS_TOKEN=tu_access_token_aqui
```

Reemplaza `tu_access_token_aqui` con el token que copiaste.

## Flujo de Funcionamiento

1. **Usuario captura foto** en `BitacoraForm.vue`
   - La foto se convierte a base64
   - Se incluye geolocalización si está disponible

2. **Usuario envía bitácora**
   - El frontend envía las evidencias con base64 al backend

3. **Backend procesa evidencias**
   - `postLlenarBitacoraSupervision` recibe las evidencias
   - Llama a `processEvidenciasToDropbox()` para cada evidencia
   - Cada imagen se sube a Dropbox
   - Se genera una URL pública
   - Se guarda la URL (y metadatos) en MongoDB

4. **Almacenamiento en MongoDB**
   - Las evidencias se guardan como objetos:
     ```javascript
     {
       url: "https://dl.dropboxusercontent.com/s/xxxxx/imagen.jpg",
       geolocation: { latitude: 4.123, longitude: -73.456, ... },
       timestamp: "2024-01-15T10:30:00.000Z"
     }
     ```
   - O como string URL si no hay metadatos

5. **Visualización**
   - `BitacoraForm.vue` carga imágenes desde URLs de Dropbox
   - `AdminDashboard.vue` muestra imágenes desde URLs
   - `generatePDF()` incluye imágenes desde URLs en el PDF

## Compatibilidad

El sistema mantiene compatibilidad con:
- Fotos antiguas almacenadas como base64
- Fotos nuevas almacenadas como URLs de Dropbox
- Objetos con URLs y metadatos
- Strings simples (URLs o base64)

## Estructura de Datos

### Evidencias en MongoDB

```javascript
evidencias: {
  piscinas: {
    "BAÑOS": {
      url: "https://dl.dropboxusercontent.com/s/xxxxx/imagen.jpg",
      geolocation: {
        latitude: 4.123456,
        longitude: -73.456789,
        accuracy: 10,
        timestamp: "2024-01-15T10:30:00.000Z"
      },
      timestamp: "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Solución de Problemas

### Las fotos no se suben a Dropbox

1. Verifica que `DROPBOX_ACCESS_TOKEN` esté configurado en `variables.env`
2. Verifica que el token sea válido y no haya expirado
3. Revisa los logs del servidor para ver errores específicos
4. Si falla Dropbox, el sistema guardará el base64 original como fallback

### Las fotos no se muestran

1. Verifica que las URLs de Dropbox sean accesibles públicamente
2. Verifica que el navegador tenga acceso a internet
3. Revisa la consola del navegador para errores CORS o de carga

### Error: "DROPBOX_ACCESS_TOKEN no está configurado"

- Agrega el token en `variables.env`
- Reinicia el servidor después de agregar el token

## Notas Importantes

- Las URLs de Dropbox son públicas y accesibles sin autenticación
- Las imágenes se organizan en la carpeta `/orbix_test_app_api/` en Dropbox
- Cada imagen tiene un nombre único basado en área, item y timestamp
- Los metadatos (geolocalización) se guardan junto con la URL
- Si Dropbox falla, el sistema guarda el base64 original como respaldo

## Próximos Pasos (Opcional)

1. Implementar limpieza de imágenes antiguas en Dropbox
2. Agregar compresión de imágenes antes de subir
3. Implementar cache de imágenes en el frontend
4. Agregar indicador de progreso durante la subida

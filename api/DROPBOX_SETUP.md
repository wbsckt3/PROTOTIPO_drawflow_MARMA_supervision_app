# Configuración de Dropbox para Bitácoras

## Información de la App

- **App Name**: OrbixApi
- **App Key**: 1lv4ew73m9mlwsv
- **App Secret**: 0f3gw9qxfmaq6k6
- **App Folder**: OrbixApi

## Configuración inicial de la App

### 1. Habilitar Permisos (Scopes) necesarios

**⚠️ IMPORTANTE: Esto debe hacerse ANTES de generar el Access Token**

1. Ve a https://www.dropbox.com/developers/apps
2. Inicia sesión con tu cuenta de Dropbox
3. Busca la app "OrbixApi" o créala si no existe
4. Ve a la pestaña **"Permissions"** (Permisos)
5. Habilita los siguientes scopes:
   - ✅ **files.content.write** (OBLIGATORIO - para subir archivos)
   - ✅ **files.content.read** (Recomendado - para leer archivos)
   - ✅ **sharing.write** (Recomendado - para crear links compartidos)
6. **Guarda los cambios** (Save changes)

### 2. Generar el Access Token

1. En la configuración de la app, ve a la sección **"OAuth 2"**
2. Genera un Access Token
   - **IMPORTANTE**: Selecciona "No expiration" (sin expiración) para tokens de larga duración
   - Si generas un token de corta duración, expirará y necesitarás renovarlo
   - **IMPORTANTE**: Si cambias los permisos después, debes generar un NUEVO token
3. Copia el Access Token generado

## ⚠️ Si el token expira

Si ves el error `expired_access_token` en los logs:
1. Ve a https://www.dropbox.com/developers/apps
2. Busca la app "orbix_test_app_api"
3. Genera un nuevo Access Token (preferiblemente sin expiración)
4. Actualiza `DROPBOX_ACCESS_TOKEN` en `variables.env` en el servidor
5. Reinicia el servidor: `pm2 restart all`

## Configurar el Access Token en el proyecto

1. Abre el archivo `variables.env` en la raíz del proyecto
2. Agrega la siguiente línea:
   ```
   DROPBOX_ACCESS_TOKEN=tu_access_token_aqui
   ```
3. Reemplaza `tu_access_token_aqui` con el token que copiaste

## Notas importantes

- El Access Token debe tener permisos de lectura y escritura en la carpeta de la app
- Las imágenes se guardarán en la carpeta `/orbix_test_app_api/` en Dropbox
- Cada imagen se guarda con un nombre único basado en el área, item y timestamp
- Si el Access Token expira, necesitarás generar uno nuevo y actualizarlo en `variables.env`

## Estructura de archivos en Dropbox

```
/orbix_test_app_api/
  ├── piscinas_BAÑOS_2024-01-15T10-30-00-000Z.jpg
  ├── piscinas_BAÑOS_2024-01-15T10-30-00-000Z_metadata.json
  ├── zonas_externas_VIDRIOS_VENTANAS_2024-01-15T11-00-00-000Z.jpg
  └── ...
```

## Solución de problemas

### Error: "DROPBOX_ACCESS_TOKEN no está configurado"
- Verifica que el token esté en `variables.env`
- Asegúrate de que el archivo `.env` esté siendo cargado por la aplicación

### Error: "expired_access_token" (Token expirado)
1. Ve a https://www.dropbox.com/developers/apps
2. Busca la app "orbix_test_app_api"
3. Genera un nuevo Access Token (preferiblemente sin expiración)
4. Actualiza `DROPBOX_ACCESS_TOKEN` en `variables.env` en el servidor
5. Reinicia el servidor: `pm2 restart all`

### Error: "files.content.write" scope no habilitado
**Este es el error más común. La app necesita permisos específicos.**

1. Ve a https://www.dropbox.com/developers/apps
2. Busca la app "orbix_test_app_api" (ID: 5758675)
3. Ve a la pestaña **"Permissions"**
4. Habilita los siguientes scopes:
   - ✅ **files.content.write** (OBLIGATORIO)
   - ✅ **files.content.read** (recomendado)
   - ✅ **sharing.write** (recomendado)
5. **Guarda los cambios**
6. **IMPORTANTE**: Genera un NUEVO Access Token (los tokens antiguos no tienen los nuevos permisos)
7. Actualiza `DROPBOX_ACCESS_TOKEN` en `variables.env`
8. Reinicia el servidor: `pm2 restart all`

### Las imágenes no se suben
- Revisa los logs del servidor para ver errores específicos
- Verifica que el Access Token tenga permisos de escritura
- Asegúrate de que los scopes estén habilitados en la app
- Verifica que hayas generado un nuevo token después de habilitar los scopes

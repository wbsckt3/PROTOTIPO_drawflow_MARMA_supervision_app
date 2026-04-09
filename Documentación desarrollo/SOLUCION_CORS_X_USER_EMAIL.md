# Solución: CORS Missing Allow Header - x-user-email

## Problema

El error dice:
```
La cabecera 'x-user-email' no está permitida de acuerdo a la cabecera 
'Access-Control-Allow-Headers' de la verificación previa de la respuesta CORS.
```

Esto significa que **Nginx está respondiendo al OPTIONS** antes de que llegue al backend, y la configuración de Nginx **NO incluye `x-user-email`** en los headers permitidos.

## Solución

### Paso 1: Corregir la URL en el frontend ✅

Ya está corregido en `vue3_vite_local/src/config/api.js`:
```javascript
export const API_BASE_URL = 'https://api.techguard.pro/api/api/tenant'
```

### Paso 2: Aplicar la configuración de Nginx

El archivo `nginx_config_techguard.conf` ya tiene la configuración correcta con `x-user-email` incluido. Necesitas aplicarlo en el servidor:

```bash
# 1. Copiar el archivo a sites-available
sudo cp nginx_config_techguard.conf /etc/nginx/sites-available/api-techguard.conf

# 2. Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/api-techguard.conf /etc/nginx/sites-enabled/

# 3. Verificar que la configuración sea válida
sudo nginx -t

# 4. Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

### Paso 3: Verificar que funciona

1. **Probar el OPTIONS manualmente:**
   ```bash
   curl -X OPTIONS https://api.techguard.pro/api/api/tenant/bitacoras-supervision \
     -H "Origin: https://www.techguard.pro" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: x-user-email" \
     -v
   ```
   
   Deberías ver en la respuesta:
   ```
   < access-control-allow-headers: Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With
   ```

2. **Verificar logs de Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/api-techguard-access.log
   sudo tail -f /var/log/nginx/api-techguard-error.log
   ```

## Puntos Clave de la Configuración

La configuración de Nginx **DEBE** incluir `x-user-email` en dos lugares:

1. **En el manejo de OPTIONS (línea 53):**
   ```nginx
   add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
   ```

2. **En las respuestas normales (línea 103):**
   ```nginx
   add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
   ```

## Si el Problema Persiste

### Verificar que Nginx está usando la configuración correcta

```bash
# Ver qué archivos de configuración están activos
sudo ls -la /etc/nginx/sites-enabled/

# Ver la configuración completa que Nginx está usando
sudo nginx -T | grep -A 20 "server_name api.techguard.pro"
```

### Verificar que el backend está recibiendo las peticiones

En los logs del backend deberías ver:
```
🔍 OPTIONS Preflight recibido: { ... }
✅ x-user-email está en los headers permitidos
```

Si NO ves estos logs, significa que Nginx está respondiendo al OPTIONS antes de que llegue al backend.

### Solución Temporal: Deshabilitar el manejo de OPTIONS en Nginx

Si no puedes modificar Nginx inmediatamente, puedes hacer que Nginx pase TODAS las peticiones (incluyendo OPTIONS) al backend:

```nginx
location / {
    # NO manejar OPTIONS aquí, pasarlo todo al backend
    proxy_pass http://localhost:8080;
    # ... resto de configuración
}
```

Pero esto requiere que el backend maneje OPTIONS correctamente (que ya lo hace).

## Resumen

El problema es que **Nginx está interceptando el OPTIONS** y respondiendo con headers CORS que NO incluyen `x-user-email`. La solución es aplicar la configuración de `nginx_config_techguard.conf` que SÍ incluye `x-user-email` en los headers permitidos.


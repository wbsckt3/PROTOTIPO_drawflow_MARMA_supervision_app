# Solución para CORS 403 en api.techguard.pro

## Problema

El preflight OPTIONS está devolviendo **403** y el header `Access-Control-Allow-Headers` solo incluye `Authorization,Content-Type` pero **NO incluye `x-user-email`**.

Esto significa que **Nginx está interceptando el OPTIONS** antes de que llegue al backend Node.js.

## Solución: Configurar Nginx

### Paso 1: Crear configuración de Nginx

El archivo `nginx_config_techguard.conf` ya está creado con la configuración correcta.

### Paso 2: Instalar la configuración en el servidor

```bash
# 1. Copiar el archivo a sites-available
sudo cp nginx_config_techguard.conf /etc/nginx/sites-available/api-techguard.conf

# 2. Crear enlace simbólico en sites-enabled
sudo ln -s /etc/nginx/sites-available/api-techguard.conf /etc/nginx/sites-enabled/

# 3. Verificar que la configuración sea válida
sudo nginx -t

# 4. Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

### Paso 3: Verificar que funciona

1. **Verificar que Nginx está escuchando:**
   ```bash
   sudo netstat -tlnp | grep :443
   # o
   sudo ss -tlnp | grep :443
   ```

2. **Probar el OPTIONS manualmente:**
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

3. **Verificar logs de Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/api-techguard-access.log
   sudo tail -f /var/log/nginx/api-techguard-error.log
   ```

## Puntos Clave de la Configuración

1. **Manejo de OPTIONS ANTES del proxy:**
   - Nginx responde directamente al OPTIONS con 204
   - Incluye `x-user-email` en `Access-Control-Allow-Headers`

2. **Headers CORS en todas las respuestas:**
   - Incluye `x-user-email` en los headers permitidos
   - Usa `always` para asegurar que se añadan incluso en errores

3. **Orígenes permitidos:**
   - `https://www.techguard.pro`
   - `https://techguard.pro`
   - `https://d1b516p7fooukz.cloudfront.net`

## Si el Problema Persiste

### Verificar que el backend está corriendo

```bash
# Verificar que Node.js está escuchando en el puerto 8080
sudo netstat -tlnp | grep :8080
# o
sudo ss -tlnp | grep :8080
```

### Verificar que Nginx está pasando las peticiones al backend

En los logs de Nginx deberías ver las peticiones GET después del OPTIONS:

```bash
sudo tail -f /var/log/nginx/api-techguard-access.log
```

### Verificar logs del backend

En los logs de Node.js deberías ver:
```
🔍 OPTIONS Preflight: { origin: 'https://www.techguard.pro', ... }
📥 GET /api/api/tenant/bitacoras-supervision - Origin: https://www.techguard.pro - User: wbsckt2@gmail.com
```

## Nota sobre la URL

La URL de la API es `/api/api/tenant/...` (con `/api` duplicado). Esto es correcto según la configuración actual:
- El primer `/api` es parte de la ruta de Nginx
- El segundo `/api` es parte de la ruta del backend (`/api/tenant`)

Si quieres cambiar esto, necesitarías ajustar la configuración de Nginx o del backend.


# Verificar si Nginx está bloqueando OPTIONS

## Paso 1: Verificar si Nginx está corriendo

```bash
sudo systemctl status nginx
# o
ps aux | grep nginx
```

## Paso 2: Verificar configuración actual de Nginx

```bash
# Ver todos los archivos de configuración
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/

# Ver configuración principal
cat /etc/nginx/nginx.conf

# Ver configuración de sitios
cat /etc/nginx/sites-enabled/*
```

## Paso 3: Ver logs de Nginx en tiempo real

```bash
# En una terminal, monitorea los logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Mientras haces una solicitud desde el navegador, deberías ver:
# - OPTIONS /api/tenant/bitacoras-supervision
# - Si ves 499, Nginx está bloqueando la solicitud
```

## Paso 4: Verificar si las solicitudes llegan al servidor Node.js

```bash
# Ver logs del servidor Node.js
pm2 logs
# o
tail -f /ruta/a/logs/server.log

# Si NO ves "🔍 OPTIONS Preflight recibido" cuando haces una solicitud,
# significa que Nginx está bloqueando las solicitudes antes de que lleguen a Node.js
```

## Paso 5: Aplicar la configuración

Si Nginx está corriendo y bloqueando las solicitudes:

1. **Copia el archivo de configuración:**
   ```bash
   sudo cp nginx_config_sslip.conf /etc/nginx/sites-available/api-sslip.conf
   ```

2. **Crea el enlace simbólico:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/api-sslip.conf /etc/nginx/sites-enabled/
   ```

3. **Verifica la configuración:**
   ```bash
   sudo nginx -t
   ```

4. **Si hay errores, corrige las rutas de certificados SSL:**
   - Si no tienes certificados SSL, comenta las líneas de `ssl_certificate`
   - O genera certificados auto-firmados para testing

5. **Recarga Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

## Paso 6: Si no tienes Nginx

Si no tienes Nginx instalado, el problema puede ser:

1. **sslip.io está haciendo proxy automáticamente**
   - En este caso, sslip.io puede estar bloqueando OPTIONS
   - Prueba usar el dominio sin subdominio: `https://50-17-36-133.sslip.io:8080/api/tenant`

2. **Otro proxy (como Cloudflare, etc.)**
   - Verifica si hay algún proxy delante del servidor

3. **Firewall bloqueando**
   ```bash
   # Verificar firewall
   sudo ufw status
   sudo iptables -L -n
   ```

## Solución Rápida (si no puedes configurar Nginx ahora)

Si no puedes configurar Nginx inmediatamente, puedes probar temporalmente:

1. **Usar HTTP directamente** (solo para testing):
   ```javascript
   // En vue3_vite_local/src/config/api.js
   export const API_BASE_URL = 'http://50.17.36.133:8080/api/tenant'
   ```
   ⚠️ Esto causará Mixed Content desde HTTPS, pero te permitirá verificar que el servidor funciona.

2. **Verificar si el servidor responde directamente:**
   ```bash
   # Desde el servidor
   curl -X GET http://localhost:8080/api/tenant/bitacoras-supervision \
     -H "x-user-email: wbsckt2@gmail.com" \
     -H "Accept: application/json"
   ```

## Verificación Final

Después de configurar Nginx:

1. **Haz una solicitud desde el navegador**
2. **Verifica en DevTools → Network:**
   - OPTIONS debería tener código **204** (no 499)
   - GET debería tener código **200** (o el código de respuesta del servidor)

3. **Verifica en los logs de Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```
   Deberías ver:
   ```
   "OPTIONS /api/tenant/bitacoras-supervision HTTP/1.1" 204
   "GET /api/tenant/bitacoras-supervision HTTP/1.1" 200
   ```

4. **Verifica en los logs de Node.js:**
   Deberías ver:
   ```
   🔍 OPTIONS Preflight recibido: ...
   📥 GET /api/tenant/bitacoras-supervision - Origin: ...
   ```


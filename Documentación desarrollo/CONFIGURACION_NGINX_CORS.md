# Configuración de Nginx para CORS

## Problema

Si estás viendo el código de estado **499** (Client Closed Request), es muy probable que haya un **Nginx** delante del servidor Node.js que está bloqueando las solicitudes OPTIONS (preflight) de CORS.

## Solución: Configurar Nginx

Si tienes Nginx delante del servidor Node.js, necesitas configurarlo para que permita solicitudes OPTIONS y pase los headers de CORS correctamente.

### 1. Editar configuración de Nginx

Edita el archivo de configuración de Nginx (normalmente en `/etc/nginx/sites-available/default` o `/etc/nginx/conf.d/default.conf`):

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.50-17-36-133.sslip.io;

    # Certificados SSL (si usas HTTPS)
    ssl_certificate /ruta/a/cert.pem;
    ssl_certificate_key /ruta/a/key.pem;

    # Configuración para CORS
    location / {
        # Permitir solicitudes OPTIONS (preflight)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-user-email, x-editor-email, Accept, Origin, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' '86400' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy al servidor Node.js
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Añadir headers de CORS para todas las respuestas
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-user-email, x-editor-email, Accept, Origin, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
}
```

### 2. Verificar configuración

```bash
sudo nginx -t
```

### 3. Recargar Nginx

```bash
sudo systemctl reload nginx
# o
sudo service nginx reload
```

## Alternativa: Configuración más simple (solo para desarrollo)

Si quieres una solución rápida para desarrollo (pero menos segura):

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.50-17-36-133.sslip.io;

    location / {
        # Permitir todas las solicitudes OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' '*' always;
            add_header 'Access-Control-Allow-Headers' '*' always;
            add_header 'Access-Control-Max-Age' '86400' always;
            return 204;
        }

        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS para todas las respuestas
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}
```

⚠️ **ADVERTENCIA**: Usar `*` en `Access-Control-Allow-Origin` es menos seguro y no funciona con `credentials: true`. Solo para desarrollo.

## Verificación

Después de configurar Nginx:

1. Verifica que las solicitudes OPTIONS lleguen al servidor:
   ```bash
   # Ver logs de Nginx
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

2. Prueba desde el navegador:
   - Abre DevTools → Network
   - Haz una solicitud desde el frontend
   - Deberías ver que la solicitud OPTIONS tiene código 204 (no 499)

3. Verifica que el servidor Node.js reciba las solicitudes:
   - Revisa los logs del servidor Node.js
   - Deberías ver: `🔍 OPTIONS Preflight recibido: ...`

## Si sslip.io está haciendo proxy

Si `sslip.io` está actuando como proxy (no Nginx), puede que necesites configurar el servidor directamente. En ese caso:

1. Asegúrate de que el servidor Node.js esté escuchando en el puerto correcto
2. Verifica que el firewall permita conexiones en ese puerto
3. Revisa los logs del servidor para ver si las solicitudes OPTIONS están llegando

## Troubleshooting

### Error 499 persiste:
- Verifica que Nginx esté configurado correctamente
- Revisa los logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
- Verifica que el servidor Node.js esté corriendo: `pm2 list` o `ps aux | grep node`

### CORS headers no aparecen:
- Asegúrate de usar `always` en `add_header` de Nginx
- Verifica que el proxy esté pasando los headers correctamente

### Solicitudes OPTIONS no llegan al servidor Node.js:
- Verifica que Nginx no esté bloqueando las solicitudes
- Revisa la configuración de `if ($request_method = 'OPTIONS')` en Nginx


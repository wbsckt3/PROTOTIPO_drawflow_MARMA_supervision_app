# Solución: Headers CORS Duplicados

## Problema

El error dice:
```
Access-Control-Allow-Origin' no coincide con 'https://www.techguard.pro, https://www.techguard.pro'
```

Esto significa que el header `Access-Control-Allow-Origin` está duplicado: aparece dos veces con el mismo valor, y el navegador los concatena con comas.

## Causa

Tanto **Nginx** como el **backend** están añadiendo headers CORS:

1. **Nginx** (línea 45 del archivo actual):
   ```nginx
   add_header 'Access-Control-Allow-Origin' "$cors_origin" always;
   ```

2. **Backend** (`server.js` línea 158 y 177):
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
   ```

Cuando ambos añaden el mismo header, el navegador los concatena: `'https://www.techguard.pro, https://www.techguard.pro'`

## Solución

**Eliminar los headers CORS de Nginx** y dejar que el backend los maneje completamente.

### Configuración Corregida de Nginx

```nginx
location /api/ {
    # Proxy al backend Node.js
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin $http_origin;  # 👈 Pasar el Origin al backend

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # ❌ ELIMINAR todos los add_header CORS
    # El backend ya los maneja correctamente
}
```

### Cambios Específicos

**Eliminar estas líneas de Nginx:**
```nginx
# ❌ ELIMINAR:
set $cors_origin "";
if ($http_origin ~* ^https?://(www\.)?techguard\.pro$) {
    set $cors_origin $http_origin;
}

add_header 'Access-Control-Allow-Origin' "$cors_origin" always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, x-user-email, x-editor-email, Origin, X-Requested-With' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Type' always;
add_header 'Access-Control-Max-Age' 1728000 always;
add_header 'Vary' 'Origin' always;

# ❌ ELIMINAR también el bloque OPTIONS:
if ($request_method = 'OPTIONS') {
    add_header 'Content-Length' 0;
    add_header 'Content-Type' 'text/plain';
    return 204;
}
```

## Pasos para Aplicar

1. **Edita la configuración de Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/api-techguard.conf
   # o donde esté tu configuración
   ```

2. **Elimina todas las líneas relacionadas con CORS** (las que tienen `add_header 'Access-Control-...`)

3. **Elimina el bloque `if ($request_method = 'OPTIONS')`**

4. **Deja solo el proxy básico** (ver `nginx_config_produccion_corregido.conf`)

5. **Verifica y recarga:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Verifica los logs del backend:**
   Deberías ver:
   ```
   🔍 OPTIONS Preflight recibido en backend: {
     origin: 'https://www.techguard.pro',
     ...
   }
   ✅ Headers CORS configurados: {
     'Access-Control-Allow-Origin': 'https://www.techguard.pro',
     ...
   }
   ```

7. **Prueba desde el frontend:**
   - El OPTIONS debería funcionar
   - El GET debería funcionar
   - No debería haber headers duplicados

## Verificación

Después de aplicar los cambios, en DevTools → Network:

1. **OPTIONS request:**
   - Debería tener `Access-Control-Allow-Origin: https://www.techguard.pro` (una sola vez)
   - Debería tener `Access-Control-Allow-Headers: ... x-user-email ...`

2. **GET request:**
   - Debería tener `Access-Control-Allow-Origin: https://www.techguard.pro` (una sola vez)
   - Debería devolver 200 con los datos

## Por qué esto funciona

- **El backend ya maneja CORS correctamente** (incluyendo OPTIONS)
- **Nginx solo hace proxy** - no añade headers adicionales
- **No hay duplicación** - solo el backend añade headers CORS
- **Más simple** - todo el manejo de CORS está en un solo lugar

## Nota Importante

Si después de eliminar los headers CORS de Nginx sigue sin funcionar, verifica que:

1. El backend esté recibiendo el OPTIONS (ver logs)
2. El backend esté respondiendo con los headers CORS correctos
3. El `Origin` esté llegando correctamente al backend (ver logs)


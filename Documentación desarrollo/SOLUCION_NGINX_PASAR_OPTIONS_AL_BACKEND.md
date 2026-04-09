# Solución: Hacer que Nginx pase OPTIONS al Backend

## Problema

Nginx está interceptando el OPTIONS y respondiendo directamente, pero **no está añadiendo el header `Access-Control-Allow-Origin`**. El backend tiene el código correcto para manejar OPTIONS, pero nunca lo recibe.

## Solución: Pasar OPTIONS al Backend

En lugar de que Nginx responda al OPTIONS, podemos hacer que lo pase al backend. El backend ya tiene el código correcto para responder.

### Configuración Mínima de Nginx

Solo necesitas **una línea** en la configuración de Nginx para que pase el OPTIONS al backend:

```nginx
location / {
    # NO manejar OPTIONS aquí, pasarlo todo al backend
    # El backend ya maneja OPTIONS correctamente
    
    # Proxy al servidor Node.js
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    
    # Headers importantes para el proxy
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # Pasar el Origin para que el backend pueda usarlo
    proxy_set_header Origin $http_origin;
    
    # Añadir headers CORS a las respuestas del backend
    # (El backend ya los añade, pero esto asegura que estén presentes)
    add_header 'Access-Control-Allow-Origin' $http_origin always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
}
```

### Configuración Completa Recomendada

```nginx
server {
    listen 443 ssl http2;
    server_name api.techguard.pro;

    # Certificados SSL (ajustar según tu configuración)
    # ssl_certificate /ruta/a/cert.pem;
    # ssl_certificate_key /ruta/a/key.pem;

    location / {
        # CRÍTICO: NO manejar OPTIONS aquí, pasarlo al backend
        # El backend en server.js ya maneja OPTIONS correctamente
        
        # Proxy al servidor Node.js
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # Headers importantes para el proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Pasar el Origin para que el backend pueda usarlo
        proxy_set_header Origin $http_origin;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # No cachear respuestas
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
    }
}
```

## Ventajas de esta Solución

1. **No necesitas manejar CORS en Nginx**: El backend ya lo hace correctamente
2. **Configuración más simple**: Solo necesitas el proxy básico
3. **Más fácil de mantener**: Todo el CORS está en un solo lugar (el backend)
4. **Funciona automáticamente**: El backend ya tiene el código correcto

## Pasos para Aplicar

1. **Conéctate al servidor:**
   ```bash
   ssh usuario@tu-servidor
   ```

2. **Edita la configuración de Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/api-techguard.conf
   # o donde esté tu configuración
   ```

3. **Reemplaza la sección `location /`** con la configuración de arriba (sin el bloque `if ($request_method = 'OPTIONS')`)

4. **Verifica y recarga:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Verifica que funciona:**
   - El OPTIONS debería llegar al backend (verás logs en el backend)
   - El backend responderá con los headers CORS correctos

## Verificación

Después de aplicar los cambios, verifica:

1. **En los logs del backend deberías ver:**
   ```
   🔍 OPTIONS Preflight recibido en backend: { ... }
   ✅ Headers CORS configurados: { ... }
   ✅ Enviando respuesta OPTIONS 204 con headers CORS
   ```

2. **En el navegador (DevTools → Network):**
   - El OPTIONS debería devolver 204
   - Debería incluir `Access-Control-Allow-Origin: https://www.techguard.pro`
   - Debería incluir `Access-Control-Allow-Headers: ... x-user-email ...`

## Si el OPTIONS no llega al Backend

Si después de aplicar los cambios no ves los logs del backend para OPTIONS, significa que hay otra configuración de Nginx que está interceptando el OPTIONS. Busca:

```bash
# Buscar configuraciones que manejen OPTIONS
sudo grep -r "OPTIONS" /etc/nginx/
```

Y elimina o comenta cualquier bloque que maneje OPTIONS antes del `proxy_pass`.


# Solución: CORS Missing Allow Origin

## Problema

El OPTIONS devuelve 204, pero **falta el header `Access-Control-Allow-Origin`** en la respuesta. Los otros headers CORS están presentes:
- ✅ `access-control-allow-headers` (incluye `x-user-email`)
- ✅ `access-control-allow-credentials: true`
- ✅ `access-control-allow-methods`
- ❌ **FALTA: `access-control-allow-origin`**

## Causa

Nginx está respondiendo al OPTIONS, pero la configuración no está añadiendo correctamente el header `Access-Control-Allow-Origin`.

## Solución

### Verificar la configuración actual de Nginx

Conéctate al servidor y verifica la configuración:

```bash
# Ver la configuración actual para api.techguard.pro
sudo grep -A 30 "server_name api.techguard.pro" /etc/nginx/sites-available/*

# O ver todos los archivos de configuración
sudo ls -la /etc/nginx/sites-available/
sudo ls -la /etc/nginx/sites-enabled/
```

### Configuración Correcta para OPTIONS

La sección de manejo de OPTIONS **DEBE** incluir el header `Access-Control-Allow-Origin`:

```nginx
if ($request_method = 'OPTIONS') {
    # Orígenes permitidos
    set $cors_origin "";
    if ($http_origin ~* "^https://(www\.)?techguard\.pro$") {
        set $cors_origin $http_origin;
    }
    if ($http_origin ~* "^https://d1b516p7fooukz\.cloudfront\.net$") {
        set $cors_origin $http_origin;
    }
    if ($cors_origin = "") {
        set $cors_origin "https://www.techguard.pro";
    }
    
    # 👇 CRÍTICO: Este header DEBE estar presente
    add_header 'Access-Control-Allow-Origin' $cors_origin always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, X-User-Email, X-Editor-Email, Origin, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Max-Age' '1728000' always;
    add_header 'Content-Type' 'text/plain charset=UTF-8';
    add_header 'Content-Length' 0;
    return 204;
}
```

### Problema Común: `always` faltante

Si usas `add_header` dentro de un `if`, Nginx solo añade el header si el código de estado es 200, 201, 204, 206, 301, 302, 303, 304, 307, o 308. Para otros códigos (como 204), necesitas usar `always`:

```nginx
# ❌ INCORRECTO (puede no funcionar con 204)
add_header 'Access-Control-Allow-Origin' $cors_origin;

# ✅ CORRECTO (funciona siempre)
add_header 'Access-Control-Allow-Origin' $cors_origin always;
```

### Solución Rápida: Configuración Simplificada

Si la configuración actual no funciona, prueba esta versión simplificada:

```nginx
location / {
    # Manejar OPTIONS
    if ($request_method = 'OPTIONS') {
        # Permitir el origin de la petición
        add_header 'Access-Control-Allow-Origin' $http_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept, x-user-email, x-editor-email, Origin, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' '1728000' always;
        add_header 'Content-Length' 0;
        add_header 'Content-Type' 'text/plain';
        return 204;
    }

    # Proxy al backend
    proxy_pass http://localhost:8080;
    # ... resto de configuración
}
```

### Verificar que funciona

Después de aplicar los cambios:

1. **Verificar la configuración:**
   ```bash
   sudo nginx -t
   ```

2. **Recargar Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Probar el OPTIONS:**
   ```bash
   curl -X OPTIONS https://api.techguard.pro/api/tenant/bitacoras-supervision \
     -H "Origin: https://www.techguard.pro" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: x-user-email" \
     -v
   ```

   Deberías ver en la respuesta:
   ```
   < access-control-allow-origin: https://www.techguard.pro
   ```

### Si sigue sin funcionar

1. **Verificar logs de Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verificar que Nginx está usando la configuración correcta:**
   ```bash
   sudo nginx -T | grep -A 50 "server_name api.techguard.pro"
   ```

3. **Verificar que no hay múltiples configuraciones conflictivas:**
   ```bash
   sudo grep -r "api.techguard.pro" /etc/nginx/
   ```

## Nota Importante

El header `Access-Control-Allow-Origin` **DEBE coincidir exactamente** con el valor del header `Origin` de la petición. Si la petición viene de `https://www.techguard.pro`, la respuesta debe tener:
```
Access-Control-Allow-Origin: https://www.techguard.pro
```

No puede ser:
- `*` (no funciona con `credentials: true`)
- `https://techguard.pro` (sin `www`)
- Cualquier otro valor diferente


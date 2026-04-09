# Diagnóstico de Conectividad - Error "Failed to fetch"

## Problema

El frontend no puede conectarse al backend en `https://api.50-17-36-133.sslip.io/api/tenant/bitacoras-supervision`.

## Pasos de Diagnóstico

### 1. Verificar que el servidor Node.js está corriendo

```bash
# Ver procesos Node.js
pm2 list
# o
ps aux | grep node

# Ver logs del servidor
pm2 logs
# o
tail -f /ruta/a/logs/server.log
```

**Deberías ver:**
```
✅ Server listening on PORT 8080
🌐 Server accessible at http://0.0.0.0:8080
📡 API endpoints available at http://0.0.0.0:8080/api/tenant/*
✅ Rutas /api/tenant montadas correctamente
```

### 2. Verificar que el servidor responde localmente

```bash
# Desde el servidor, prueba:
curl -X GET http://localhost:8080/api/tenant/bitacoras-supervision \
  -H "x-user-email: wbsckt2@gmail.com" \
  -H "Accept: application/json"
```

**Si funciona localmente pero no desde el exterior**, el problema está en:
- Nginx (si hay uno delante)
- Firewall
- Configuración de red

### 3. Verificar que Nginx está pasando las solicitudes

Si tienes Nginx delante, verifica:

```bash
# Ver logs de acceso de Nginx
sudo tail -f /var/log/nginx/access.log

# Ver logs de error de Nginx
sudo tail -f /var/log/nginx/error.log
```

**Cuando hagas una solicitud desde el frontend, deberías ver en los logs:**
```
GET /api/tenant/bitacoras-supervision HTTP/1.1
```

### 4. Verificar configuración de Nginx

Asegúrate de que Nginx esté configurado para pasar las solicitudes a Node.js:

```nginx
location /api/tenant {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 5. Verificar conectividad desde el exterior

```bash
# Desde otra máquina o usando curl online:
curl -X GET https://api.50-17-36-133.sslip.io/api/tenant/bitacoras-supervision \
  -H "x-user-email: wbsckt2@gmail.com" \
  -H "Accept: application/json" \
  -v
```

**El flag `-v` mostrará información detallada:**
- Si la conexión se establece
- Headers de respuesta
- Código de estado HTTP

### 6. Verificar firewall

```bash
# Ver reglas de firewall (Ubuntu/Debian)
sudo ufw status

# Verificar que el puerto 8080 esté abierto
sudo netstat -tulpn | grep 8080

# Si usas firewalld (CentOS/RHEL)
sudo firewall-cmd --list-all
```

### 7. Verificar que sslip.io está resolviendo correctamente

```bash
# Verificar resolución DNS
nslookup api.50-17-36-133.sslip.io

# Debería resolver a: 50.17.36.133
```

### 8. Verificar logs del servidor Node.js

Cuando hagas una solicitud desde el frontend, deberías ver en los logs:

```
📥 GET /api/tenant/bitacoras-supervision - Origin: https://d1b516p7fooukz.cloudfront.net
```

**Si NO ves estos logs**, significa que:
- Las solicitudes no están llegando al servidor Node.js
- Hay un proxy (Nginx) bloqueando las solicitudes
- El servidor no está escuchando en el puerto correcto

## Soluciones Comunes

### Problema: El servidor no responde desde el exterior

**Solución 1: Verificar que el servidor escucha en todas las interfaces**
```javascript
server.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

**Solución 2: Verificar firewall**
```bash
# Permitir puerto 8080
sudo ufw allow 8080/tcp
```

### Problema: Nginx no pasa las solicitudes

**Solución: Verificar configuración de Nginx**
- Asegúrate de que `proxy_pass` apunta a `http://localhost:8080`
- Verifica que no haya errores de sintaxis: `sudo nginx -t`
- Recarga Nginx: `sudo systemctl reload nginx`

### Problema: Error 502 Bad Gateway

**Solución:**
- Verifica que el servidor Node.js esté corriendo
- Verifica que esté escuchando en el puerto correcto
- Verifica que Nginx pueda conectarse a `http://localhost:8080`

### Problema: Error 404 Not Found

**Solución:**
- Verifica que las rutas estén montadas correctamente
- Verifica que el path en Nginx sea correcto
- Verifica que `proxy_pass` termine con `/` o sin `/` según corresponda

## Verificación Final

Después de aplicar las correcciones:

1. **Reinicia el servidor Node.js:**
   ```bash
   pm2 restart all
   ```

2. **Reinicia Nginx (si aplica):**
   ```bash
   sudo systemctl restart nginx
   ```

3. **Prueba desde el frontend:**
   - Abre DevTools → Network
   - Haz una solicitud
   - Verifica el código de estado HTTP
   - Verifica los headers de respuesta

4. **Revisa los logs:**
   - Logs del servidor Node.js deberían mostrar las solicitudes entrantes
   - Logs de Nginx deberían mostrar las solicitudes proxy

## Si el problema persiste

1. **Captura un screenshot de:**
   - DevTools → Network tab (mostrando la solicitud fallida)
   - Logs del servidor Node.js
   - Logs de Nginx (si aplica)

2. **Información a verificar:**
   - ¿El servidor Node.js está corriendo?
   - ¿Qué puerto está usando?
   - ¿Hay Nginx delante?
   - ¿Qué muestra `curl` desde el servidor?
   - ¿Qué muestra `curl` desde el exterior?


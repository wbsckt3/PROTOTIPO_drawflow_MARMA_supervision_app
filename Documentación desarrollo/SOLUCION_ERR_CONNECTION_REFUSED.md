# Solución para ERR_CONNECTION_REFUSED

## Diagnóstico

El error `ERR_CONNECTION_REFUSED` significa que el navegador **no puede establecer la conexión TCP** con el servidor. Esto puede ser:

1. **Problema del servidor** (pero Postman funciona, así que no es esto)
2. **Problema de sslip.io** - El proxy puede no estar configurado correctamente
3. **Problema de puerto** - sslip.io puede estar esperando un puerto diferente
4. **Problema de HTTPS** - El navegador está intentando HTTPS pero el servidor solo escucha HTTP

## Verificación Paso a Paso

### 1. Verificar que el servidor está corriendo

```bash
# Ver procesos Node.js
pm2 list

# Ver logs
pm2 logs

# Verificar que está escuchando en el puerto correcto
netstat -tulpn | grep 8080
# o
ss -tulpn | grep 8080
```

**Deberías ver:**
```
✅ Server listening on PORT 8080
🌐 Server accessible at http://0.0.0.0:8080
```

### 2. Verificar que sslip.io está redirigiendo correctamente

Desde el navegador, prueba acceder directamente a:
```
https://api.50-17-36-133.sslip.io
```

**Si no carga**, sslip.io puede no estar configurado correctamente.

### 3. Verificar desde el servidor

Desde el servidor mismo, prueba:

```bash
# Probar HTTP directo
curl -v http://localhost:8080/api/tenant/bitacoras-supervision \
  -H "x-user-email: wbsckt2@gmail.com"

# Probar a través de sslip.io (desde el servidor)
curl -v https://api.50-17-36-133.sslip.io/api/tenant/bitacoras-supervision \
  -H "x-user-email: wbsckt2@gmail.com" \
  -k
```

### 4. Verificar configuración de sslip.io

`sslip.io` funciona de manera diferente a `nip.io`:

- **nip.io**: Resuelve directamente a la IP
- **sslip.io**: Puede requerir configuración adicional o puede estar haciendo proxy

**Verificar DNS:**
```bash
nslookup api.50-17-36-133.sslip.io
```

**Debería resolver a:** `50.17.36.133`

## Soluciones Posibles

### Solución 1: Verificar que sslip.io está funcionando

`sslip.io` puede requerir que el servidor esté accesible desde el exterior. Verifica:

1. **El servidor debe estar escuchando en `0.0.0.0`** (ya lo configuramos)
2. **El puerto debe estar abierto en el firewall**
3. **El servidor debe estar accesible desde Internet**

### Solución 2: Usar HTTP directamente (temporal para testing)

Si sslip.io no está funcionando correctamente, puedes probar temporalmente con HTTP directo:

```javascript
// En vue3_vite_local/src/config/api.js
export const API_BASE_URL = 'http://50.17.36.133:8080/api/tenant'
```

⚠️ **ADVERTENCIA**: Esto causará Mixed Content desde HTTPS, pero te permitirá verificar si el problema es sslip.io.

### Solución 3: Configurar Nginx como proxy HTTPS

Si sslip.io no funciona, puedes configurar Nginx para manejar HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name api.50-17-36-133.sslip.io;

    ssl_certificate /ruta/a/cert.pem;
    ssl_certificate_key /ruta/a/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Solución 4: Verificar que no hay firewall bloqueando

```bash
# Verificar firewall (Ubuntu/Debian)
sudo ufw status

# Si está activo, permitir puerto 8080
sudo ufw allow 8080/tcp

# Verificar firewall (CentOS/RHEL)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## Diagnóstico Específico para sslip.io

`sslip.io` funciona de manera diferente dependiendo de cómo se acceda:

1. **HTTP**: `http://50-17-36-133.sslip.io` → Resuelve a `50.17.36.133:80`
2. **HTTPS**: `https://50-17-36-133.sslip.io` → Resuelve a `50.17.36.133:443`
3. **Con subdominio**: `https://api.50-17-36-133.sslip.io` → Puede requerir configuración especial

**El problema puede ser:**
- sslip.io está intentando conectarse al puerto 443 (HTTPS) pero el servidor solo escucha en 8080
- Necesitas un proxy (Nginx) que escuche en 443 y redirija a 8080

## Verificación Rápida

Ejecuta estos comandos en el servidor:

```bash
# 1. Verificar que el servidor está corriendo
pm2 list

# 2. Verificar que está escuchando
netstat -tulpn | grep 8080

# 3. Probar localmente
curl http://localhost:8080/api/tenant/bitacoras-supervision \
  -H "x-user-email: wbsckt2@gmail.com"

# 4. Verificar DNS
nslookup api.50-17-36-133.sslip.io

# 5. Probar desde el servidor a través de sslip.io
curl -k https://api.50-17-36-133.sslip.io/api/tenant/bitacoras-supervision \
  -H "x-user-email: wbsckt2@gmail.com"
```

## Si Nada Funciona

Si ninguna de las soluciones funciona, puede ser que:

1. **sslip.io no soporte subdominios personalizados** como `api.50-17-36-133.sslip.io`
2. **Necesites usar el dominio sin subdominio**: `https://50-17-36-133.sslip.io`
3. **Necesites configurar un proxy inverso (Nginx) con SSL**

## Próximos Pasos

1. **Verifica que el servidor está corriendo** (Paso 1)
2. **Prueba desde el servidor** (Paso 3)
3. **Si funciona desde el servidor pero no desde el navegador**, el problema es sslip.io o Nginx
4. **Si no funciona desde el servidor**, el problema es la configuración del servidor


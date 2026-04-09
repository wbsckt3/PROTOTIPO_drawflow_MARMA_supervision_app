# Instrucciones para Aplicar la Configuración de Nginx

## Problemas Identificados y Solucionados

1. ✅ **Redirecciones no deseadas a `/orbix/auth`**: 
   - El router de Vue estaba interceptando la ruta `/` 
   - Solución: Separar el landing (`/`) de la app Vue (`/orbix/`)

2. ✅ **CSS no carga en HTTPS con www**:
   - Problema con tipos MIME y alias en nginx
   - Solución: Configuración mejorada de tipos MIME y headers

3. ✅ **Página en blanco en HTTP con www**:
   - Problema con redirecciones HTTP a HTTPS
   - Solución: Redirecciones mejoradas que mantienen el host

## Pasos para Aplicar

### 1. Hacer Backup de la Configuración Actual
```bash
sudo cp /etc/nginx/sites-available/techguard.pro /etc/nginx/sites-available/techguard.pro.backup
```

### 2. Copiar la Nueva Configuración
```bash
# Desde tu máquina local, copiar al servidor
scp nginx/techguard.pro usuario@servidor:/tmp/techguard.pro

# En el servidor
sudo cp /tmp/techguard.pro /etc/nginx/sites-available/techguard.pro
```

### 3. Verificar que los Archivos Existan
```bash
# Verificar landing
ls -la /var/www/index.html

# Verificar assets de Orbix
ls -la /var/www/orbix/vue3_vite_local/dist/orbix/assets/
# Deberías ver: index-*.css y index-*.js

# Verificar index.html de Orbix
ls -la /var/www/orbix/vue3_vite_local/dist/orbix/index.html
```

### 4. Verificar Permisos
```bash
# Asegurar que nginx pueda leer los archivos
sudo chown -R www-data:www-data /var/www/orbix/vue3_vite_local/dist/orbix/
sudo chmod -R 755 /var/www/orbix/vue3_vite_local/dist/orbix/
sudo chown -R www-data:www-data /var/www/
sudo chmod -R 755 /var/www/
```

### 5. Verificar la Configuración de Nginx
```bash
sudo nginx -t
```

Si hay errores, corregirlos antes de continuar.

### 6. Recargar Nginx
```bash
sudo systemctl reload nginx
# o
sudo nginx -s reload
```

### 7. Verificar que Funcione

#### Probar el Landing:
- `https://techguard.pro` → Debe mostrar el landing (NO debe redirigir a `/orbix/auth`)
- `https://www.techguard.pro` → Debe mostrar el landing

#### Probar la App Orbix:
- `https://techguard.pro/orbix` → Debe cargar la app Vue y redirigir a `/orbix/auth`
- `https://www.techguard.pro/orbix` → Debe cargar la app Vue y redirigir a `/orbix/auth`
- Verificar en DevTools → Network que los CSS se carguen con código 200

#### Probar Redirecciones HTTP:
- `http://techguard.pro` → Debe redirigir a `https://techguard.pro`
- `http://www.techguard.pro` → Debe redirigir a `https://www.techguard.pro`

## Diagnóstico si Algo Falla

### Si el CSS no carga:
```bash
# Verificar que el archivo existe
cat /var/www/orbix/vue3_vite_local/dist/orbix/assets/index-*.css

# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log

# Verificar que nginx esté usando la configuración correcta
sudo nginx -T | grep -A 10 "location /orbix/assets"
```

### Si hay redirecciones no deseadas:
```bash
# Verificar logs de acceso
sudo tail -f /var/log/nginx/access.log

# Verificar que el landing exista
cat /var/www/index.html | head -20
```

### Si la página queda en blanco:
```bash
# Verificar errores de JavaScript en el navegador (DevTools → Console)
# Verificar que los archivos JS se carguen
curl -I https://techguard.pro/orbix/assets/index-*.js
```

## Rollback si es Necesario

Si algo sale mal, restaurar el backup:
```bash
sudo cp /etc/nginx/sites-available/techguard.pro.backup /etc/nginx/sites-available/techguard.pro
sudo nginx -t
sudo systemctl reload nginx
```

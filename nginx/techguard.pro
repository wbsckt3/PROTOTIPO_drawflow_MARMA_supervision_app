server {
    server_name techguard.pro www.techguard.pro;

    root /var/www;
    index index.html;
    
    # Aumentar límite de tamaño del body globalmente (para todas las ubicaciones)
    # 50MB debería ser suficiente para múltiples fotos en base64
    client_max_body_size 50M;

    # ======================
    # HOME - Landing page (NO debe servir la app Vue)
    # Funciona igual para techguard.pro y www.techguard.pro
    # ======================
    location = / {
        root /var/www;
        try_files /index.html =404;
    }
    
    # Servir archivos estáticos del landing (css, js, img, html)
    location ~ ^/(css|js|img|html)/ {
        root /var/www;
        try_files $uri =404;
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }

    # ======================
    # ORBIX ASSETS (CSS, JS, imágenes, etc.) - DEBE IR ANTES DE /orbix
    # Prioridad: más específico primero
    # Ruta según arquitectura: /var/www/orbix/vue3_vite_local/dist/orbix/
    # ======================
    location /orbix/assets/ {
        alias /var/www/orbix/vue3_vite_local/dist/orbix/assets/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
        # Asegurar tipos MIME correctos para CSS y JS
        types {
            text/css css;
            application/javascript js mjs;
            text/javascript js;
            image/png png;
            image/jpeg jpg jpeg;
            image/svg+xml svg;
        }
        # Headers CORS si es necesario
        add_header Access-Control-Allow-Origin * always;
    }

    # ======================
    # ORBIX FAVICON Y OTROS ESTÁTICOS (fuera de assets/)
    # Ruta según arquitectura: /var/www/orbix/vue3_vite_local/dist/orbix/
    # ======================
    location ~ ^/orbix/(favicon\.ico|.*\.(png|jpg|jpeg|gif|svg|ico|woff2?))$ {
        alias /var/www/orbix/vue3_vite_local/dist/orbix/$1;
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }

    # ======================
    # ORBIX SPA - DEBE IR DESPUÉS DE LOS ASSETS
    # Esta ubicación captura todo lo que no sea assets
    # Ruta según arquitectura: /var/www/orbix/vue3_vite_local/dist/orbix/
    # ======================
    location /orbix {
        alias /var/www/orbix/vue3_vite_local/dist/orbix/;
        try_files $uri $uri/ /orbix/index.html;
        # Asegurar tipos MIME correctos
        types {
            text/html html;
            text/css css;
            application/javascript js;
            text/javascript js;
        }
        # Asegurar que las redirecciones mantengan el mismo host
        # No forzar ningún cambio de host
    }

    # ======================
    # API NODE
    # /orbix/api/ -> http://127.0.0.1:8080/api/tenant/
    # ======================
    location /orbix/api/ {
        proxy_pass http://127.0.0.1:8080/api/tenant/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Aumentar límite de tamaño del body para permitir imágenes en base64
        # 50MB debería ser suficiente para múltiples fotos
        client_max_body_size 50M;
        proxy_request_buffering off;
        
    }

    # ======================
    # STATIC CACHE (solo para archivos en la raíz, no en /orbix/)
    # Los archivos de /orbix/ ya tienen cache en sus ubicaciones específicas arriba
    # ======================
    # Comentado para evitar conflictos con /orbix/assets/
    # location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
    #     expires 1y;
    #     access_log off;
    #     add_header Cache-Control "public";
    # }

    # ======================
    # SSL
    # ======================
    listen 443 ssl;
    listen [::]:443 ssl;

    ssl_certificate /etc/letsencrypt/live/techguard.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/techguard.pro/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP ? HTTPS
# Redirigir HTTP a HTTPS, pero mantener el mismo host (no forzar www)
server {
    listen 80;
    listen [::]:80;
    server_name techguard.pro www.techguard.pro;
    
    # Redirigir manteniendo el mismo host
    if ($host = www.techguard.pro) {
        return 301 https://www.techguard.pro$request_uri;
    }
    if ($host = techguard.pro) {
        return 301 https://techguard.pro$request_uri;
    }
    
    # Fallback
    return 301 https://$host$request_uri;
}

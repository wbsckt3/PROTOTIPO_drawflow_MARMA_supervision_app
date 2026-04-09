const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
// cors ya no se usa, ahora usamos CORS manual
// const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const { Telegraf } = require('telegraf');
// http-proxy-middleware no se está usando actualmente (proxy fue removido)
// Si necesitas usarlo en el futuro, descomenta:
// const { createProxyMiddleware } = require('http-proxy-middleware');

require("dotenv").config({ path: "variables.env" });

const socketIo = require('socket.io');

const app = express();
const fs = require('fs');

// Configurar trust proxy para que Express confíe en los headers X-Forwarded-*
// Necesario cuando hay un proxy delante (Nginx, Cloudflare, sslip.io, etc.)
app.set('trust proxy', true);

// Configuración HTTPS opcional (si hay certificados)
let server;
let httpsServer = null;
const useHTTPS = process.env.USE_HTTPS === 'true';

if (useHTTPS) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
    };
    httpsServer = require('https').createServer(httpsOptions, app);
    console.log('🔒 Servidor HTTPS configurado');
  } catch (err) {
    console.warn('⚠️ No se encontraron certificados SSL. Usando HTTP solamente.');
    console.warn('   Para habilitar HTTPS, configura USE_HTTPS=true y las rutas SSL_KEY_PATH y SSL_CERT_PATH');
  }
}

// Servidor HTTP (siempre disponible)
server = require('http').createServer(app);

// Si HTTPS está disponible, también escuchar en puerto 8443
if (httpsServer) {
  const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS Server listening on PORT ${HTTPS_PORT}`);
  });
}

const io = socketIo(server);

// CORS básico y directo - DEBE estar ANTES de cualquier otra ruta
app.use((req, res, next) => {
  // Lista de orígenes permitidos
  const allow = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://techguard.pro',
    'https://www.techguard.pro',
    'https://api.techguard.pro',
    'https://d1b516p7fooukz.cloudfront.net'
  ];
  
  // Origen por defecto (si el origin no está en la lista)
  const DEFAULT_ORIGIN = 'https://www.techguard.pro';
  
  // Obtener el origin de la solicitud (CRÍTICO: debe ser exacto)
  let origin = req.headers.origin;
  
  // Si no hay origin pero hay Referer, extraer el origin del Referer
  if (!origin && req.headers.referer) {
    try {
      const url = new URL(req.headers.referer);
      origin = url.origin;
    } catch (e) {
      // Ignorar error
    }
  }
  
  // Normalizar origins (sin trailing slash, en minúsculas para comparación)
  const normalizedOrigin = origin ? origin.replace(/\/$/, '').toLowerCase() : null;
  const normalizedAllow = allow.map(o => o.replace(/\/$/, '').toLowerCase());
  
  // Determinar qué origin usar - DEBE ser el origin EXACTO de la petición si está permitido
  let allowedOrigin = DEFAULT_ORIGIN;
  if (normalizedOrigin && normalizedAllow.includes(normalizedOrigin)) {
    // Usar el origin EXACTO de la petición (sin normalizar a minúsculas)
    allowedOrigin = origin.replace(/\/$/, '');
  }
  
  // Headers permitidos - incluir x-user-email explícitamente (case-sensitive)
  const requestedHeaders = req.headers['access-control-request-headers'];
  
  // Lista base de headers permitidos - SIEMPRE incluir x-user-email
  const baseAllowedHeaders = [
    'Authorization',
    'Content-Type',
    'Accept',
    'x-user-email',  // 👈 Header personalizado (case-sensitive) - CRÍTICO
    'X-User-Email',  // Variante con mayúsculas
    'x-editor-email',
    'X-Editor-Email',
    'Origin',
    'X-Requested-With'
  ];
  
  // Crear un Set para evitar duplicados (case-insensitive)
  const allowedHeadersSet = new Set(baseAllowedHeaders);
  
  // Si hay headers solicitados en el preflight, incluirlos automáticamente
  if (requestedHeaders) {
    const requestedList = requestedHeaders.split(',').map(h => h.trim());
    requestedList.forEach(header => {
      // Añadir el header exactamente como fue solicitado (preservar case)
      allowedHeadersSet.add(header);
      // También añadir variantes comunes
      if (header.toLowerCase() === 'x-user-email') {
        allowedHeadersSet.add('x-user-email');
        allowedHeadersSet.add('X-User-Email');
      }
    });
  }
  
  // Convertir Set a Array y ordenar para consistencia
  const allowedHeaders = Array.from(allowedHeadersSet);
  
  // CRÍTICO: Manejar OPTIONS ANTES de añadir otros headers
  // Esto asegura que el OPTIONS se maneje correctamente incluso si Nginx lo pasa
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS Preflight recibido en backend:', {
      path: req.path,
      originalUrl: req.originalUrl,
      origin: origin || 'No origin',
      allowedOrigin: allowedOrigin,
      requestedHeaders: requestedHeaders || 'No headers requested',
      allowedHeaders: allowedHeaders.join(', '),
      allHeaders: Object.keys(req.headers).filter(k => k.toLowerCase().includes('access-control') || k.toLowerCase().includes('origin'))
    });
    
    // CRÍTICO: Verificar que x-user-email está en los headers permitidos
    const hasUserEmailHeader = allowedHeaders.some(h => h.toLowerCase() === 'x-user-email');
    if (!hasUserEmailHeader) {
      console.error('❌ ERROR: x-user-email NO está en los headers permitidos!');
      console.error('   Headers permitidos:', allowedHeaders);
      // Añadirlo de todas formas
      allowedHeaders.push('x-user-email');
    } else {
      console.log('✅ x-user-email está en los headers permitidos');
    }
    
    // CRÍTICO: Añadir TODOS los headers CORS antes de responder
    // Asegurar que Access-Control-Allow-Origin esté presente
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin'); // Importante para caché
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', '1728000'); // 20 días
    
    // Verificar que los headers se añadieron correctamente
    console.log('✅ Headers CORS configurados:', {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': allowedHeaders.join(', ')
    });
    
    // Responder inmediatamente con 204
    console.log('✅ Enviando respuesta OPTIONS 204 con headers CORS');
    return res.status(204).end();
  }
  
  // Para peticiones no-OPTIONS, añadir headers CORS normalmente
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin'); // Importante para caché
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  res.setHeader('Access-Control-Max-Age', '1728000'); // 20 días
  
  // Logging para peticiones no-OPTIONS
  const userEmail = req.headers['x-user-email'] || req.headers['X-User-Email'] || 'No email';
  
  // En producción, solo loggear rutas de API para evitar spam de logs
  if (process.env.NODE_ENV === "production") {
    if (req.path.startsWith('/api/tenant')) {
      console.log(`📥 ${req.method} ${req.path} - Origin: ${origin || 'No origin'} - User: ${userEmail}`);
    } else if (req.path === '/') {
      // No loggear peticiones a / en producción (son normales, Nginx las maneja)
      // Solo loggear si hay un problema real
    } else {
      // Solo loggear si no es una ruta común de bots/scanners
      const ignoredPaths = ['/actuator', '/login', '/cgi-bin', '/.well-known', '/favicon.ico', '/robots.txt'];
      if (!ignoredPaths.some(ignored => req.path.startsWith(ignored) || req.path === ignored)) {
        // Solo loggear una vez cada 100 peticiones para evitar spam
        if (Math.random() < 0.01) {
          console.warn(`⚠️ Petición a ruta no-API en producción: ${req.method} ${req.path} - Debería ser manejada por Nginx`);
        }
      }
    }
  } else {
    console.log(`📥 ${req.method} ${req.path} - Origin: ${origin || 'No origin'} - User: ${userEmail}`);
  }
  
  next();
});

// ===== PROXY REMOVIDO =====
// El proxy fue removido porque las rutas /api/tenant están en el mismo servidor
// Si necesitas el proxy en el futuro, descomenta y configura el target correcto

// Usar la conexión centralizada de mongoose.js
require('./mongoose');

const paypal = require('paypal-ipn');
const https = require('https');
const qs = require('querystring');

// const User = require("./models/User");
// const Obj = require("./models/Obj");



// URL Router
// NOTA: Esta ruta solo se usa si se accede directamente al servidor Node.js (puerto 8080)
// En producción, Nginx maneja todas las rutas excepto /api/tenant/*
// Agregar middleware para ignorar rutas no-API en producción ANTES de las rutas
app.use((req, res, next) => {
  // En producción, solo manejar rutas de API
  // Si la ruta no es /api/tenant/*, devolver 404 sin intentar servir archivos
  if (process.env.NODE_ENV === "production" && !req.path.startsWith('/api/tenant') && req.path !== '/') {
    console.warn(`⚠️ Petición a ruta no-API en producción: ${req.method} ${req.path}`);
    console.warn('⚠️ Esta ruta debería ser manejada por Nginx, no por Node.js');
    return res.status(404).json({ 
      error: 'Not found',
      message: 'Esta ruta debe ser manejada por Nginx. Accede a través del dominio configurado.'
    });
  }
  next();
});

app.get('/', function (req, res) {
  const indexPath = path.join(__dirname, 'index.html');
  // Verificar que el archivo existe antes de intentar servirlo
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Si no existe, devolver un mensaje indicando que se debe usar Nginx
    console.warn('⚠️ Intento de acceder a / directamente en Node.js. El archivo index.html no existe en:', indexPath);
    console.warn('⚠️ En producción, Nginx debe manejar todas las rutas excepto /api/tenant/*');
    res.status(404).json({ 
      error: 'Not found',
      message: 'Esta ruta debe ser manejada por Nginx. Accede a través del dominio configurado.'
    });
  }
});

// Rutas para archivos estáticos específicos (solo si existen)
app.get('/piloto_marma/auth.js', function (req, res) {
  const filePath = path.join(__dirname, 'piloto_marma/auth.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.warn('⚠️ Archivo no encontrado:', filePath);
    res.status(404).json({ error: 'File not found' });
  }
});

app.get('/piloto_marma/formulario_v2.html', function (req, res) {
  const filePath = path.join(__dirname, 'piloto_marma/formulario_v2.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.warn('⚠️ Archivo no encontrado:', filePath);
    res.status(404).json({ error: 'File not found' });
  }
});

app.get('/piloto_marma/formulario.html', function (req, res) {
  const filePath = path.join(__dirname, 'piloto_marma/formulario.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.warn('⚠️ Archivo no encontrado:', filePath);
    res.status(404).json({ error: 'File not found' });
  }
});


// api Tenant Router: 
   const tenantRoutes = require('./api/routes/tenant.routes');
   require("dotenv").config({ path: "variables.api.env" });
// Middlewares
// Aumentar límite del body parser para permitir fotos en base64 (50MB)
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Rutas API del admin tenant: 
   app.use('/api/tenant', tenantRoutes);
   
   // Logging para verificar que las rutas están montadas
   console.log('✅ Rutas /api/api/tenant montadas correctamente'); 



// Servir cualquier archivo estático (favicon, imágenes, etc.)
// Solo si las carpetas existen para evitar errores ENOENT
const dist1Path = path.join(__dirname, 'api/dist1');
const dist2Path = path.join(__dirname, 'api/dist2');

if (fs.existsSync(dist1Path)) {
  app.use(express.static(dist1Path, {
    extensions: ['html', 'svg', 'ico']
  }));
} else {
  console.log('ℹ️ api/dist1 no existe, omitiendo middleware static');
}

if (fs.existsSync(dist2Path)) {
  app.use(express.static(dist2Path, {
    extensions: ['html', 'svg', 'ico']
  }));
} else {
  console.log('ℹ️ api/dist2 no existe, omitiendo middleware static');
}

// bloque de producción para el frontend con un npm run build sobre react, vue o angular
  // NOTA: En producción con Nginx, este bloque NO debería ejecutarse
  // Nginx maneja todos los archivos estáticos y solo pasa /api/tenant/* al servidor Node.js
  if (process.env.NODE_ENV === "production") {
    const clientBuildPath = path.join(__dirname, "client", "build");
    // Solo servir archivos estáticos si la carpeta existe
    if (fs.existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      // Captura solo rutas que no sean /api/**
      app.get(/^\/(?!api).*/, (req, res) => {
        const indexPath = path.join(clientBuildPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.warn('⚠️ Intento de acceder a ruta no-API en producción. index.html no existe en:', indexPath);
          res.status(404).json({ 
            error: 'Not found',
            message: 'Esta ruta debe ser manejada por Nginx. Accede a través del dominio configurado.'
          });
        }
      });
    } else {
      console.log('ℹ️ client/build no existe. Nginx debe manejar los archivos estáticos.');
    }
  }

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {  
   console.log(`✅ Server listening on PORT ${PORT}`);
   console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
   console.log(`📡 API endpoints available at http://0.0.0.0:${PORT}/api/tenant/*`);
}); 

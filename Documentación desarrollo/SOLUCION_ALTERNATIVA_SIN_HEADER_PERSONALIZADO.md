# Solución Alternativa: Enviar Email sin Header Personalizado

## Problema

El header personalizado `x-user-email` requiere una solicitud OPTIONS (preflight) que está siendo bloqueada por Nginx (código 499).

## Solución Alternativa

En lugar de usar un header personalizado, puedes enviar el email como:

### Opción 1: Query Parameter (Más Simple)

**Frontend:**
```javascript
// En vue3_vite_local/src/stores/bitacoras.js
const response = await fetch(`${API_BASE_URL}/bitacoras-supervision?userEmail=${encodeURIComponent(authStore.userEmail)}`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  },
  signal: controller.signal
})
```

**Backend:**
```javascript
// En api/controllers/reglas-negocio.controller.js
exports.getBitacorasSupervision = async (req, res) => {
  try {
    // Obtener email del query parameter o del header
    const userEmail = req.query.userEmail?.toLowerCase().trim() || 
                     req.headers['x-user-email']?.toLowerCase().trim();
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }
    // ... resto del código
  }
}
```

### Opción 2: Usar Header Authorization Estándar

**Frontend:**
```javascript
const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${authStore.userEmail}` // O usar un formato diferente
  },
  signal: controller.signal
})
```

**Backend:**
```javascript
// Extraer email del header Authorization
const authHeader = req.headers.authorization;
const userEmail = authHeader?.replace('Bearer ', '').toLowerCase().trim();
```

### Opción 3: Enviar en el Body (solo para POST/PUT)

Si la solicitud es POST, puedes enviar el email en el body:

**Frontend:**
```javascript
const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ userEmail: authStore.userEmail }),
  signal: controller.signal
})
```

## Recomendación

**Opción 1 (Query Parameter)** es la más simple y no requiere preflight OPTIONS porque:
- No usa headers personalizados
- Es compatible con GET requests
- No requiere configuración adicional de CORS

**Desventaja:** El email aparece en la URL (logs, historial, etc.)

## Si prefieres mantener el header personalizado

El problema real es que Nginx está bloqueando OPTIONS. Necesitas:

1. **Configurar Nginx** para permitir OPTIONS (ver `nginx_config_sslip.conf`)
2. **O usar un proxy diferente** que no bloquee OPTIONS
3. **O exponer el servidor Node.js directamente** sin proxy (menos seguro)

## Implementación Rápida (Query Parameter)

Si quieres probar rápidamente sin header personalizado:

1. **Actualiza el frontend:**
```javascript
// vue3_vite_local/src/stores/bitacoras.js
const response = await fetch(`${API_BASE_URL}/bitacoras-supervision?userEmail=${encodeURIComponent(authStore.userEmail)}`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  },
  signal: controller.signal
})
```

2. **Actualiza el backend:**
```javascript
// api/controllers/reglas-negocio.controller.js
const userEmail = req.query.userEmail?.toLowerCase().trim() || 
                 req.headers['x-user-email']?.toLowerCase().trim();
```

Esto evitará el preflight OPTIONS y debería funcionar inmediatamente.


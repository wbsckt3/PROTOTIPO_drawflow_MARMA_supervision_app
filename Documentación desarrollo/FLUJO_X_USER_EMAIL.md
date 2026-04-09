# Flujo del Header x-user-email

## 1. Google Sign-In → Guardar en localStorage

**Archivo:** `vue3_vite_local/src/stores/auth.js`

### Cuando el usuario inicia sesión con Google:

```javascript
// Línea 56: Se obtiene el email del payload de Google
userEmail.value = payload.email

// Línea 64: Se guarda en localStorage
localStorage.setItem('userEmail', userEmail.value)
```

**Ubicación exacta:**
```javascript:56:64:vue3_vite_local/src/stores/auth.js
userEmail.value = payload.email
isAuthenticated.value = true

// Guardar en localStorage (igual que el auth.js original)
localStorage.setItem('refactorii_token', response.credential)
localStorage.setItem('token_expiry', (Date.now() + (24 * 60 * 60 * 1000)).toString())
localStorage.setItem('user_data', JSON.stringify(userData))
localStorage.setItem('user', JSON.stringify(user.value))
localStorage.setItem('userEmail', userEmail.value)  // 👈 AQUÍ SE GUARDA
localStorage.setItem('isAuthenticated', 'true')
```

## 2. Inicializar Auth → Recuperar de localStorage

**Archivo:** `vue3_vite_local/src/stores/auth.js`

### Cuando la app se carga:

```javascript
// Línea 98: Se recupera del localStorage
const storedEmail = localStorage.getItem('userEmail')

// Línea 131: Se asigna al ref reactivo
userEmail.value = storedEmail
```

**Ubicación exacta:**
```javascript:98:131:vue3_vite_local/src/stores/auth.js
const storedEmail = localStorage.getItem('userEmail')  // 👈 AQUÍ SE RECUPERA
const storedAuth = localStorage.getItem('isAuthenticated')

// ... validaciones ...

// Token válido, restaurar usuario
if (storedUser && storedEmail && storedAuth === 'true') {
  try {
    user.value = JSON.parse(storedUser)
    userEmail.value = storedEmail  // 👈 AQUÍ SE ASIGNA AL REF
    isAuthenticated.value = true
    console.log('✅ Usuario autenticado correctamente:', userEmail.value)
    return true
  }
}
```

## 3. Hacer GET → Enviar en header

**Archivo:** `vue3_vite_local/src/stores/bitacoras.js`

### Cuando se cargan las bitácoras:

```javascript
// Línea 21: Verificar que existe
if (!authStore.userEmail) {
  console.error('❌ No hay email de usuario disponible')
  return
}

// Línea 42: Se usa en el header
const headers = {
  'Accept': 'application/json',
  'x-user-email': authStore.userEmail  // 👈 AQUÍ SE USA
}

// Línea 53: Se envía en el fetch
const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
  method: 'GET',
  headers: headers,  // 👈 AQUÍ SE ENVÍA
  credentials: 'include',
  signal: controller.signal
})
```

**Ubicación exacta:**
```javascript:40:58:vue3_vite_local/src/stores/bitacoras.js
const headers = {
  'Accept': 'application/json',
  'x-user-email': authStore.userEmail  // 👈 AQUÍ SE CONSTRUYE EL HEADER
}

console.log('🔍 Headers que se enviarán:', headers)
console.log('🔍 Tipo de userEmail:', typeof authStore.userEmail)
console.log('🔍 Valor de userEmail:', authStore.userEmail)

// Crear un AbortController para timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
  method: 'GET',
  headers: headers,  // 👈 AQUÍ SE ENVÍA EN LA PETICIÓN
  credentials: 'include', // 👈 CRÍTICO: Incluir credenciales (cookies, etc.)
  signal: controller.signal
})
```

## Verificación en el Navegador

Para verificar que el header se está enviando:

1. **Abre DevTools** (F12)
2. **Ve a la pestaña Network**
3. **Filtra por "bitacoras-supervision"**
4. **Haz clic en la petición GET**
5. **Ve a la pestaña "Headers"**
6. **Busca en "Request Headers":**
   ```
   x-user-email: wbsckt2@gmail.com
   ```

## Verificación en la Consola

El código ya tiene logging. Deberías ver en la consola:

```
🔍 Cargando bitácoras para supervisor: wbsckt2@gmail.com
🔍 Headers que se enviarán: { Accept: 'application/json', 'x-user-email': 'wbsckt2@gmail.com' }
🔍 Tipo de userEmail: string
🔍 Valor de userEmail: wbsckt2@gmail.com
```

## Posibles Problemas

### 1. `userEmail` está vacío

**Síntoma:** En la consola ves `userEmail: ''` o `userEmail: undefined`

**Causa:** No se guardó correctamente en localStorage o no se recuperó

**Solución:** Verifica que:
- El usuario haya iniciado sesión correctamente
- En DevTools → Application → Local Storage, existe la clave `userEmail`
- El valor de `userEmail` en localStorage no esté vacío

### 2. `authStore.userEmail` no está disponible

**Síntoma:** El código muestra "❌ No hay email de usuario disponible"

**Causa:** El `authStore` no se inicializó correctamente

**Solución:** Verifica que:
- `initializeAuth()` se haya llamado en `main.js`
- El usuario esté autenticado (`isAuthenticated.value === true`)

### 3. El header no se envía

**Síntoma:** En Network → Headers, no ves `x-user-email`

**Causa:** El header no se está construyendo correctamente

**Solución:** Verifica que:
- `headers` tenga el formato correcto
- El fetch esté usando `headers: headers` (no `headers: { ... }` directamente)

## Debug Rápido

Añade esto temporalmente en `bitacoras.js` para ver qué está pasando:

```javascript
console.log('🔍 DEBUG authStore:', {
  userEmail: authStore.userEmail,
  isAuthenticated: authStore.isAuthenticated,
  user: authStore.user,
  localStorage_userEmail: localStorage.getItem('userEmail')
})
```


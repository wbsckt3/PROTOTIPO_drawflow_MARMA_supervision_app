# 🏢 API para Dueño del Tenant - Tech Guard Pro

## 📋 Descripción General

Esta documentación cubre los **4 endpoints principales** que utiliza el **dueño del tenant** para configurar y gestionar su empresa en el sistema Tech Guard Pro. Estos endpoints permiten:

- Crear y autenticar usuarios
- Crear empresas
- Relacionar usuarios con empresas y roles
- Gestionar la configuración inicial del sistema

---

## 🔗 Endpoints Disponibles

### 1. **Autenticación con Google Sign-In**
**POST** `/api/tenant/auth/google-signin`

Crea o autentica un usuario mediante Google Sign-In.

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "FullName": "Juan Pérez",
  "GivenName": "Juan",
  "FamilyName": "Pérez",
  "ImageURL": "https://lh3.googleusercontent.com/a/AATXAJz0_example_image_url",
  "Email": "juan.perez@example.com"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Usuario autenticado exitosamente",
  "data": {
    "_id": "user_id",
    "FullName": "Juan Pérez",
    "Email": "juan.perez@example.com",
    "ImageURL": "https://lh3.googleusercontent.com/a/AATXAJz0_example_image_url",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. **Crear Empresa**
**POST** `/api/tenant/companies`

Crea una nueva empresa y devuelve el `companyId` para relacionar usuarios.

#### Headers
```
x-user-email: usuario@ejemplo.com
Content-Type: application/json
```

#### Body
```json
{
  "name": "Mi Empresa S.A.",
  "subdomain": "empresa2",
  "description": "Descripción de la empresa"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Empresa creada exitosamente",
  "data": {
    "_id": "bcb1a6db71f9973ff91c00103a33e873",
    "name": "Mi Empresa S.A.",
    "subdomain": "empresa2",
    "description": "Descripción de la empresa",
    "ownerEmail": "usuario@ejemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. **Relacionar Usuario con Empresa**
**POST** `/api/tenant/companies/relate-user`

Relaciona un usuario con una empresa y asigna un rol específico.

#### Headers
```
x-user-email: usuario@ejemplo.com
Content-Type: application/json
```

#### Body
```json
{
  "companyId": "bcb1a6db71f9973ff91c00103a33e873",
  "role": "admin"
}
```

#### Roles Disponibles
- `admin`: Administrador completo del sistema
- `supervisor`: Supervisor de campo
- `viewer`: Solo lectura (por defecto)

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Usuario relacionado exitosamente",
  "data": {
    "userId": "user_id",
    "companyId": "bcb1a6db71f9973ff91c00103a33e873",
    "role": "admin",
    "relatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. **Obtener Empresas del Usuario**
**GET** `/api/tenant/companies`

Obtiene todas las empresas relacionadas con el usuario autenticado.

#### Headers
```
x-user-email: usuario@ejemplo.com
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "bcb1a6db71f9973ff91c00103a33e873",
      "name": "Mi Empresa S.A.",
      "subdomain": "empresa2",
      "description": "Descripción de la empresa",
      "role": "admin",
      "relatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 🔄 Flujo de Configuración Inicial

### Paso 1: Autenticación
1. El usuario inicia sesión con Google
2. Se ejecuta automáticamente el endpoint `/auth/google-signin`
3. Se crea o actualiza el usuario en la base de datos

### Paso 2: Crear Empresa
1. El usuario (ahora autenticado) crea su empresa
2. Se ejecuta `POST /companies`
3. Se obtiene el `companyId` para futuras operaciones

### Paso 3: Asignar Roles
1. El usuario se relaciona con la empresa como `admin`
2. Se ejecuta `POST /companies/relate-user`
3. Se pueden agregar más usuarios con diferentes roles

### Paso 4: Verificar Configuración
1. Se consultan las empresas del usuario
2. Se ejecuta `GET /companies`
3. Se confirma la configuración correcta

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Campos obligatorios faltantes |
| 401 | Email de usuario no proporcionado |
| 409 | Empresa ya existe con ese subdomain |
| 500 | Error interno del servidor |

---

## 📱 Integración con Frontend

### Desde `formulario.html` (Dashboard Admin)
- **Autenticación**: Se ejecuta automáticamente al iniciar sesión
- **Crear Empresa**: Botón "Crear Empresa" en el dashboard
- **Gestionar Usuarios**: Sección de usuarios en el dashboard
- **Ver Empresas**: Lista de empresas en el sidebar

### Variables de Entorno
```javascript
const API_BASE_URL = 'https://www.refactorii.com/api/tenant';
const USER_EMAIL = 'usuario@ejemplo.com';
```

---

## 🚀 Ejemplo de Uso Completo

```javascript
// 1. Autenticación (automática desde Google Sign-In)
const authResponse = await fetch(`${API_BASE_URL}/auth/google-signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    FullName: 'Juan Pérez',
    GivenName: 'Juan',
    FamilyName: 'Pérez',
    ImageURL: 'https://lh3.googleusercontent.com/a/...',
    Email: 'juan.perez@example.com'
  })
});

// 2. Crear empresa
const companyResponse = await fetch(`${API_BASE_URL}/companies`, {
  method: 'POST',
  headers: {
    'x-user-email': 'juan.perez@example.com',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Mi Empresa S.A.',
    subdomain: 'empresa2',
    description: 'Descripción de la empresa'
  })
});

const company = await companyResponse.json();
const companyId = company.data._id;

// 3. Relacionar usuario como admin
await fetch(`${API_BASE_URL}/companies/relate-user`, {
  method: 'POST',
  headers: {
    'x-user-email': 'juan.perez@example.com',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyId: companyId,
    role: 'admin'
  })
});

// 4. Verificar empresas
const companiesResponse = await fetch(`${API_BASE_URL}/companies`, {
  headers: { 'x-user-email': 'juan.perez@example.com' }
});

const companies = await companiesResponse.json();
console.log('Empresas del usuario:', companies.data);
```

---

## 📋 Notas Importantes

- **Subdomain único**: Cada empresa debe tener un subdomain único
- **Roles jerárquicos**: `admin` > `supervisor` > `viewer`
- **Autenticación requerida**: Todos los endpoints (excepto auth) requieren `x-user-email`
- **CompanyId**: Se usa en todos los endpoints posteriores para identificar la empresa
- **Google Sign-In**: Es el único método de autenticación soportado

---

## 🔗 Próximos Pasos

Una vez configurada la empresa, el dueño del tenant puede:
1. **Agregar supervisores** usando los endpoints de admin
2. **Crear unidades residenciales** para sus propiedades
3. **Programar visitas** de supervisión
4. **Gestionar el sistema** desde el dashboard admin



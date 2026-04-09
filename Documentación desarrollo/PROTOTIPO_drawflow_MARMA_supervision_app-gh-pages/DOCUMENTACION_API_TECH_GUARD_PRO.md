# 📋 DOCUMENTACIÓN API TECH GUARD PRO
## Plataforma de Supervisión de Unidades Residenciales

---

## 🎯 **RESUMEN EJECUTIVO**

**Tech Guard Pro** es una plataforma multi-tenant para la supervisión de unidades residenciales. Permite a empresas administrar supervisores que realizan inspecciones en conjuntos residenciales, registrando el estado de diferentes áreas y elementos.

### **Arquitectura:**
- **Frontend**: Aplicación web con Google Sign-in
- **Backend**: API REST con Node.js y MongoDB
- **Multi-tenant**: Cada empresa tiene sus propios datos
- **Roles**: Admin (gestión) y Editor (supervisión)

---

## 🔧 **ENDPOINTS DE GESTIÓN DE TENANT**

### **1. Crear Usuario Google Sign-in**
```http
POST https://www.refactorii.com/api/tenant/auth/google-signin
Content-Type: application/json

{
  "FullName": "Juan Pérez",
  "GivenName": "Juan", 
  "FamilyName": "Pérez",
  "ImageURL": "https://lh3.googleusercontent.com/a/AATXAJz0_example_image_url",
  "Email": "juan.perez@example.com"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id_generated",
    "Email": "juan.perez@example.com",
    "FullName": "Juan Pérez"
  }
}
```

---

### **2. Crear Empresa**
```http
POST https://www.refactorii.com/api/tenant/companies
x-user-email: usuario@ejemplo.com
Content-Type: application/json

{
  "name": "Mi Empresa S.A.",
  "subdomain": "empresa2", 
  "description": "Descripción de la empresa"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "c6a01b29f99628a47fac180d168b45f7",
    "name": "Mi Empresa S.A.",
    "subdomain": "empresa2"
  }
}
```

---

### **3. Relacionar Usuario con Empresa**
```http
POST https://www.refactorii.com/api/tenant/companies/relate-user
x-user-email: usuario@ejemplo.com
Content-Type: application/json

{
  "companyId": "c6a01b29f99628a47fac180d168b45f7",
  "role": "admin"
}
```

**Roles disponibles:**
- `admin`: Gestión completa de la empresa
- `editor`: Solo supervisión (supervisores)
- `viewer`: Solo lectura

---

### **4. Obtener Empresas del Usuario**
```http
GET https://www.refactorii.com/api/tenant/companies
x-user-email: usuario@ejemplo.com
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "c6a01b29f99628a47fac180d168b45f7",
      "name": "Mi Empresa S.A.",
      "subdomain": "empresa2",
      "role": "admin"
    }
  ]
}
```

---

## 🏢 **ENDPOINTS DE REGLAS DE NEGOCIO**

### **0. ADMIN - Crear Unidad Residencial**
```http
POST https://www.refactorii.com/api/tenant/unidades-residenciales
x-user-email: admin@marma.com
Content-Type: application/json

{
  "nombre": "Torre A - Conjunto Residencial Los Pinos",
  "direccion": "Carrera 15 #93-47, Bogotá, Colombia",
  "tipo": "Conjunto Residencial",
  "companyId": "507f1f77bcf86cd799439011",
  "areas": {
    "piscinas": {
      "BAÑOS": "E",
      "ROMPE OLAS": "B",
      "ANDENES": "E"
    },
    "zonas_comunes": {
      "GIMNASIO": "E",
      "SALÓN SOCIAL": "B"
    },
    "zonas_externas": {
      "ZONA VERDES": "E",
      "CAÑUELAS": "B"
    },
    "oficinas": {
      "ESCRITORIOS": "E",
      "PAPELERAS": "B"
    },
    "operario": {
      "PRODUCTIVIDAD": "E",
      "PRESENTACIÓN": "B"
    }
  }
}
```

**Parámetros requeridos:**
- `nombre` (string): Nombre de la unidad residencial
- `direccion` (string): Dirección física de la unidad
- `tipo` (string): Tipo de unidad (ej: "Conjunto Residencial", "Edificio", "Casa")

**Parámetros opcionales:**
- `companyId` (string): ID de la empresa. Si no se envía, usa la primera empresa del usuario
- `areas` (object): Áreas de supervisión personalizadas. Si no se envía, usa las áreas por defecto del modelo

**Headers requeridos:**
- `x-user-email`: Email del usuario administrador

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Unidad residencial creada exitosamente",
  "data": {
    "_id": "123e4567-e89b-12d3-a456-426614174000",
    "companyId": "507f1f77bcf86cd799439011",
    "nombre": "Torre A - Conjunto Residencial Los Pinos",
    "direccion": "Carrera 15 #93-47, Bogotá, Colombia",
    "tipo": "Conjunto Residencial",
    "areas": {
      "piscinas": {
        "BAÑOS": "E",
        "ROMPE OLAS": "B",
        "ANDENES": "E"
      },
      "zonas_comunes": {
        "GIMNASIO": "E",
        "SALÓN SOCIAL": "B"
      },
      "zonas_externas": {
        "ZONA VERDES": "E",
        "CAÑUELAS": "B"
      },
      "oficinas": {
        "ESCRITORIOS": "E",
        "PAPELERAS": "B"
      },
      "operario": {
        "PRODUCTIVIDAD": "E",
        "PRESENTACIÓN": "B"
      }
    },
    "fechaCreacion": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Faltan datos requeridos
- `403`: No tienes acceso a esa empresa
- `500`: Error interno del servidor

**Notas:**
- El usuario debe tener rol 'admin' en la empresa
- Si no se especifica `companyId`, se usa la primera empresa del usuario
- Las áreas personalizadas sobrescriben las áreas por defecto del modelo

**Áreas de supervisión disponibles:**
- **piscinas**: BAÑOS, ROMPE OLAS, ANDENES, LAVA PIES - DUCHA, SAUNA, JACUZZI, TURCO, COLOR VISUAL, PH, CLORO, HOLL
- **zonas_comunes**: GIMNASIO, SALÓN SOCIAL, SALÓN DE JUEGOS, ANDENES, PORTERÍA, PARQUEADERO
- **zonas_externas**: ZONA VERDES, CAÑUELAS, PARQUE INFANTIL, PAREDES, VIDRIOS - VENTANAS, PASAMANOS, TAPAS SHUT, GABINETES - EXTINTORES, BARRIO - TRAPEADO, ASCENSORES, TUBERÍA VOLÁTIL, ESCALAS, PISOS, SHUT BASURAS
- **oficinas**: ESCRITORIOS, PAPELERAS, SALA DE JUNTAS, AULAS, BAÑOS, RECEPCIÓN, COMPUTADORES, PAREDES, CIELO RASO, COCINETA, ENTRADAS PRINCIPAL
- **operario**: PRODUCTIVIDAD, PRESENTACIÓN, CARNET, ELEMENTOS EPP, CONTROL DE HORARIO, ACTITUD

{
  "nombre": "Conjunto Residencial Marma",
  "direccion": "Carrera 15 #93-47, Bogotá",
  "tipo": "condominio",
  "companyId": "c6a01b29f99628a47fac180d168b45f7",
  "areas": {
    "piscinas": {
      "name": "PISCINAS",
      "color": "#3b82f6",
      "items": ["BAÑOS","ROMPE OLAS","ANDENES","LAVA PIES - DUCHA","SAUNA","JACUZZI","TURCO","COLOR VISUAL","PH","CLORO","CUARTO DE MÁQUINAS","HALL"]
    },
    "zonas_comunes": {
      "name": "ZONAS COMUNES",
      "color": "#22c55e", 
      "items": ["GIMNASIO","SALÓN SOCIAL","SALÓN DE JUEGOS","ANDENES","PORTERÍA","PARQUEADERO"]
    },
    "zonas_externas": {
      "name": "ZONAS EXTERNAS",
      "color": "#f59e0b",
      "items": ["ZONA VERDES","CAÑUELAS","PARQUE INFANTIL","PAREDES","VIDRIOS - VENTANAS","PASAMANOS","TAPAS SHUT","GABINETES - EXTINTORES","BARRIO - TRAPEADO","ASCENSORES","TUBERÍA VOLÁTIL","ESCALAS","PISOS","SHUT BASURAS"]
    },
    "oficinas": {
      "name": "OFICINAS",
      "color": "#8b5cf6",
      "items": ["ESCRITORIOS","PAPELERAS","SALA DE JUNTAS","AULAS","BAÑOS","RECEPCIÓN","COMPUTADORES","PAREDES","CIELO RASO","COCINETA","ENTRADAS PRINCIPAL"]
    },
    "operario": {
      "name": "OPERARIO",
      "color": "#ef4444",
      "items": ["PRODUCTIVIDAD","PRESENTACIÓN","CARNET","ELEMENTOS EPP","CONTROL DE HORARIO","ACTITUD"]
    }
  }
}
```

---

### **1. ADMIN - Obtener Unidades Residenciales**
```http
GET https://www.refactorii.com/api/tenant/unidades-residenciales
x-user-email: admin@marma.com
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",
      "nombre": "Conjunto Residencial Marma",
      "direccion": "Carrera 15 #93-47, Bogotá",
      "tipo": "condominio",
      "companyId": "c6a01b29f99628a47fac180d168b45f7",
      "areas": { /* estructura de áreas */ }
    }
  ],
  "total": 1
}
```

---

### **2. ADMIN - Crear Bitácora de Supervisión**
```http
POST https://www.refactorii.com/api/tenant/bitacoras-supervision
x-user-email: admin@marma.com
x-editor-email: editor@marma.com
Content-Type: application/json

{
  "unidadResidencialId": "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",
  "fecha": "2025-09-24T09:00:00.000Z",
  "observaciones": "Supervisión programada para el miercoles 24 de septiembre"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "ae74113f-019a-4550-86f1-ab7cc1ac8538",
    "unidadResidencialId": "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",
    "supervisorEmail": "editor@marma.com",
    "fecha": "2025-09-24T09:00:00.000Z",
    "estado": "programada",
    "observaciones": "Supervisión programada para el miercoles 24 de septiembre"
  }
}
```

---

### **3. SUPERVISOR - Obtener Mis Bitácoras (FRONTEND)**
```http
GET https://www.refactorii.com/api/tenant/bitacoras-supervision
x-user-email: wbsckt3@gmail.com
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ae74113f-019a-4550-86f1-ab7cc1ac8538",
      "cliente": "Conjunto Residencial Marma",
      "fecha": "2025-09-24T09:00:00.000Z",
      "estado": "programada",
      "supervisor": "wbsckt3@gmail.com",
      "unidadResidencial": {
        "_id": "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",
        "nombre": "Conjunto Residencial Marma",
        "areas": { /* estructura de áreas */ }
      }
    }
  ],
  "total": 1
}
```

---

### **4. SUPERVISOR - Llenar Bitácora de Supervisión (FRONTEND)**
```http
POST https://www.refactorii.com/api/tenant/bitacoras-supervision/ID_DE_LA_BITACORA/llenar
x-user-email: editor@marma.com
Content-Type: application/json

{
  "areas": {
    "piscinas": {
      "BAÑOS": "E",
      "ROMPE OLAS": "B", 
      "ANDENES": "E",
      "LAVA PIES - DUCHA": "B"
    },
    "zonas_comunes": {
      "GIMNASIO": "B",
      "SALÓN SOCIAL": "E",
      "SALÓN DE JUEGOS": "B"
    }
  },
  "comentarios": {
    "piscinas": {
      "BAÑOS": "Requiere limpieza profunda",
      "ROMPE OLAS": "En buen estado"
    }
  },
  "evidencias": [
    {
      "area": "piscinas",
      "item": "BAÑOS",
      "tipo": "foto",
      "url": "https://ejemplo.com/evidencia1.jpg",
      "descripcion": "Estado actual de los baños"
    }
  ],
  "estado": "completada"
}
```

---

### **5. ADMIN - Obtener Bitácoras de Una Unidad Residencial**
```http
GET https://www.refactorii.com/api/tenant/unidades-residenciales/ID_DE_LA_UNIDAD_RESIDENCIAL/bitacoras
x-user-email: admin@marma.com
```

---

### **6. ADMIN - Obtener Bitácoras de Supervisor Específico**
```http
GET https://www.refactorii.com/api/tenant/bitacoras-supervision/supervisor
x-user-email: admin@marma.com
x-editor-email: editor@marma.com
```

---

### **7. FRONTEND/ADMIN - Obtener Bitácora Específica por ID**
```http
GET https://www.refactorii.com/api/tenant/bitacoras-supervision/ID_DE_LA_BITACORA
x-user-email: editor@marma.com
```

---

## 🚀 **GUÍA DE IMPLEMENTACIÓN**

### **Paso 1: Configuración Inicial**
1. Crear usuario admin
2. Crear empresa
3. Relacionar admin con empresa (rol: admin)
4. Crear usuario editor/supervisor
5. Relacionar editor con empresa (rol: editor)

### **Paso 2: Configuración de Unidades**
1. Admin crea unidades residenciales
2. Admin asigna bitácoras a supervisores
3. Supervisores acceden al frontend

### **Paso 3: Flujo de Supervisión**
1. Supervisor inicia sesión en frontend
2. Ve sus bitácoras asignadas
3. Selecciona una bitácora para llenar
4. Completa el formulario de supervisión
5. Guarda los datos

---

## 📱 **FRONTEND - FORMULARIO_V2.HTML**

### **Características:**
- ✅ **Google Sign-in**: Autenticación con Google
- ✅ **Dashboard**: Lista de bitácoras asignadas
- ✅ **Formulario Dinámico**: Basado en áreas de la unidad residencial
- ✅ **Transiciones Suaves**: Efectos visuales mejorados
- ✅ **Responsive**: Adaptable a diferentes dispositivos

### **URL de Acceso:**
```
https://wbsckt3.github.io/PROTOTIPO_drawflow_MARMA_supervision_app/formulario_v2.html
```

### **Flujo de Usuario:**
1. **Login**: Usuario se autentica con Google
2. **Dashboard**: Ve sus bitácoras asignadas
3. **Selección**: Hace clic en una bitácora
4. **Formulario**: Llena los datos de supervisión
5. **Guardado**: Envía los datos al servidor

---

## 🔐 **SEGURIDAD Y ROLES**

### **Roles del Sistema:**
- **Admin**: Gestión completa de empresa y supervisores
- **Editor**: Solo supervisión de unidades asignadas
- **Viewer**: Solo lectura (futuro)

### **Validaciones:**
- Usuarios solo acceden a datos de sus empresas
- Supervisores solo ven sus bitácoras asignadas
- Admins pueden ver todas las bitácoras de su empresa

### **Headers Obligatorios:**
- `x-user-email`: Email del usuario autenticado
- `x-editor-email`: Email del supervisor (endpoints específicos)

---

## 📊 **ESTADOS Y CALIFICACIONES**

### **Estados de Bitácora:**
- `programada`: Recién creada por admin
- `en_progreso`: Supervisor inició la supervisión
- `completada`: Supervisor terminó de llenar la bitácora
- `cancelada`: Bitácora cancelada

### **Calificaciones de Áreas:**
- `E`: Excelente
- `B`: Bueno
- `R`: Regular

---

## 🧪 **TESTING CON POSTMAN**

### **Colecciones Disponibles:**
1. **4_endpoints_POSTMAN_api_tenant_collection.json**: Gestión de tenant
2. **7_endpoints_POSTMAN_reglas_negocio.json**: Reglas de negocio

### **Datos de Prueba:**
- **Company ID**: `c6a01b29f99628a47fac180d168b45f7`
- **Unidad ID**: `c47aaa98-3c95-4d29-9d71-8f9ad7585b72`
- **Admin Email**: `admin@marma.com`
- **Editor Email**: `editor@marma.com`

---

## 📞 **SOPORTE TÉCNICO**

### **Información de Contacto:**
- **Plataforma**: Tech Guard Pro
- **Cliente Demo**: Marma S.A.S.
- **URL Base**: `https://www.refactorii.com/api/tenant`
- **Frontend**: `https://wbsckt3.github.io/PROTOTIPO_drawflow_MARMA_supervision_app/formulario_v2.html`

### **Archivos de Configuración:**
- **Modelos**: `UnidadResidencial.model.js`, `BitacoraSupervision.model.js`
- **Controladores**: `reglas-negocio.controller.js`
- **Frontend**: `formulario_v2.html`, `auth.js`

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **Backend:**
- [ ] Modelos de base de datos creados
- [ ] Controladores implementados
- [ ] Rutas configuradas
- [ ] Validaciones de seguridad
- [ ] Testing con Postman

### **Frontend:**
- [ ] Google Sign-in integrado
- [ ] Dashboard funcional
- [ ] Formulario dinámico
- [ ] Transiciones suaves
- [ ] Manejo de errores

### **Integración:**
- [ ] API conectada al frontend
- [ ] Autenticación funcionando
- [ ] Datos reales mostrados
- [ ] Flujo completo operativo

---

**© 2025 Tech Guard Pro - Plataforma de Supervisión Residencial**

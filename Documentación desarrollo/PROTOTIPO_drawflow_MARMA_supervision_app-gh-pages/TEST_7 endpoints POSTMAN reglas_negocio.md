// 7 endpoints gestión desde POSTMAN api/tenant reglas de negocio
// Supervisión de unidades residenciales - Tech Guard Pro

----------------------------------------------------

// PREPARACIÓN INICIAL (usar endpoints existentes)

1. Crear usuario admin:
POST https://www.refactorii.com/api/tenant/auth/google-signin
Headers:  
	Content-Type : application/json
Body > raw > json
	{
	  "FullName": "Admin Marma",
	  "GivenName": "Admin",
	  "FamilyName": "Marma",
	  "ImageURL": "https://lh3.googleusercontent.com/a/AATXAJz0_example_image_url",
	  "Email": "admin@marma.com"
	}

----------------------------------------------------

2. Crear empresa Marma:
POST https://www.refactorii.com/api/tenant/companies 
Headers:
  x-user-email: admin@marma.com
Body:
	{
	  "name": "Marma S.A.S.",
	  "subdomain": "marma",
	  "description": "Empresa de supervisión residencial"
	}

Produce:  _id : c6a01b29f99628a47fac180d168b45f7

----------------------------------------------------

3. Relacionar admin con empresa:
POST https://www.refactorii.com/api/tenant/companies/relate-user
Headers:
  x-user-email: admin@marma.com
Body (JSON):
{
  "companyId": "c6a01b29f99628a47fac180d168b45f7",
  "role": "admin"
}

----------------------------------------------------

4. Crear usuario editor (supervisor): 
POST https://www.refactorii.com/api/tenant/auth/google-signin
Headers:  
	Content-Type : application/json
Body > raw > json
	{
	  "FullName": "Editor Marma",
	  "GivenName": "Editor",
	  "FamilyName": "Marma",
	  "ImageURL": "https://lh3.googleusercontent.com/a/AATXAJz0_example_image_url",
	  "Email": "editor@marma.com"
	}

----------------------------------------------------

5. Relacionar editor con empresa: agregue como editor a wbsckt3@gmail.com
POST https://www.refactorii.com/api/tenant/companies/relate-user
Headers:
  x-user-email: editor@marma.com
Body (JSON):
{
  "companyId": "c6a01b29f99628a47fac180d168b45f7",
  "role": "editor"
}

----------------------------------------------------

// ENDPOINTS DE REGLAS DE NEGOCIO

// 0. ADMIN - Crear Unidad Residencial
POST https://www.refactorii.com/api/tenant/unidades-residenciales
Headers:
  x-user-email: admin@marma.com
  Content-Type: application/json
Body (JSON):
{
  "nombre": "Altos del Poblado",
  "direccion": "Carrera 15 #93-47, Medellín",
  "tipo": "condominio",
  "companyId": "c6a01b29f99628a47fac180d168b45f7",
  "areas": {
    "piscinas": {
      "name": "PISCINAS",
      "color": "#3b82f6",
      "items": ["BAÑOS","ROMPE OLAS","ANDENES","LAVA PIES - DUCHA","SAUNA","JACUZZI","TURCO","COLOR VISUAL","PH","CLORO","CUARTO DE MÁQUINAS","HOLL"]
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
    "seguridad": {
      "name": "SEGURIDAD",
      "color": "#ef4444",
      "items": ["PORTERÍA","CÁMARAS","ALARMAS","CONTROL DE ACCESO","ILUMINACIÓN","CERCAS"]
    }
  }
}

----------------------------------------------------

// 1. ADMIN - Obtener Unidades Residenciales
GET https://www.refactorii.com/api/tenant/unidades-residenciales
Headers:
  x-user-email: admin@marma.com

Produce: companyId: "c6a01b29f99628a47fac180d168b45f7",
Produce: _id de unidad: "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",
para el siguiente endpoint en : "unidadResidencialId": "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",

----------------------------------------------------

// 2. ADMIN - Crear Bitácora de Supervisión
POST https://www.refactorii.com/api/tenant/bitacoras-supervision
Headers:
  x-user-email: admin@marma.com
  x-editor-email: wbsckt3@gmail.com
  Content-Type: application/json
Body (JSON):
{
  "unidadResidencialId": "c47aaa98-3c95-4d29-9d71-8f9ad7585b72",
  "fecha": "2025-09-24T09:00:00.000Z",
  "observaciones": "Supervisión programada para el miercoles 24 de septiembre"
}

----------------------------------------------------

// 3. SUPERVISOR - Obtener Mis Bitácoras (FRONTEND)
GET https://www.refactorii.com/api/tenant/bitacoras-supervision
Headers:
  x-user-email: wbsckt3@gmail.com // es decir el email del supervisor

----------------------------------------------------

// 4. SUPERVISOR - Llenar Bitácora de Supervisión (FRONTEND)
POST https://www.refactorii.com/api/tenant/bitacoras-supervision/ae74113f-019a-4550-86f1-ab7cc1ac8538/llenar
Headers:
  x-user-email: wbsckt3@gmail.com
  Content-Type: application/json
Body (JSON):
{
  "areas": {
    "piscinas": {
      "BAÑOS": "E",
      "ROMPE OLAS": "B",
      "ANDENES": "E",
      "LAVA PIES - DUCHA": "B",
      "SAUNA": "E",
      "JACUZZI": "B",
      "TURCO": "E",
      "COLOR VISUAL": "B",
      "PH": "E",
      "CLORO": "B",
      "CUARTO DE MÁQUINAS": "E",
      "HOLL": "B"
    },
    "zonas_comunes": {
      "GIMNASIO": "B",
      "SALÓN SOCIAL": "E",
      "SALÓN DE JUEGOS": "B",
      "ANDENES": "E",
      "PORTERÍA": "B",
      "PARQUEADERO": "E"
    }
  },
  "comentarios": {
    "piscinas": {
      "BAÑOS": "Requiere limpieza profunda",
      "ROMPE OLAS": "En buen estado",
      "ANDENES": "Necesita reparación en baldosas"
    }
  },
  "evidencias": {
    "piscinas": {
      "BAÑOS": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    }
  },
  "estado": "completada"
}

----------------------------------------------------

// 5. ADMIN - Obtener Bitácoras de Una Unidad Residencial
GET https://www.refactorii.com/api/tenant/unidades-residenciales/ID_DE_LA_UNIDAD_RESIDENCIAL/bitacoras
Headers:
  x-user-email: admin@marma.com

----------------------------------------------------

// 6. ADMIN - Obtener Bitácoras de Supervisor Específico
GET https://www.refactorii.com/api/tenant/bitacoras-supervision/supervisor
Headers:
  x-user-email: admin@marma.com
  x-supervisor-email: editor@marma.com

----------------------------------------------------

// 7. FRONTEND/ADMIN - Obtener Bitácora Específica por ID
GET https://www.refactorii.com/api/tenant/bitacoras-supervision/ID_DE_LA_BITACORA
Headers:
  x-user-email: editor@marma.com
  // O admin@marma.com para admin

----------------------------------------------------

// DATOS DE EJEMPLO PARA TESTING

// Unidad Residencial de Ejemplo:
{
  "nombre": "Conjunto Residencial Marma",
  "direccion": "Carrera 15 #93-47, Bogotá",
  "tipo": "condominio",
  "areas": {
    "piscinas": {
      "name": "PISCINAS",
      "color": "#3b82f6",
      "items": ["BAÑOS","ROMPE OLAS","ANDENES","LAVA PIES - DUCHA","SAUNA","JACUZZI","TURCO","COLOR VISUAL","PH","CLORO","CUARTO DE MÁQUINAS","HOLL"]
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
    "seguridad": {
      "name": "SEGURIDAD",
      "color": "#ef4444",
      "items": ["PORTERÍA","CÁMARAS","ALARMAS","CONTROL DE ACCESO","ILUMINACIÓN","CERCAS"]
    }
  }
}

// Bitácora de Supervisión de Ejemplo:
{
  "unidadResidencialId": "uuid-unidad-residencial",
  "fecha": "2025-01-20T09:00:00.000Z",
  "observaciones": "Supervisión programada para el lunes 20 de enero",
  "estado": "programada"
}

// Datos para Llenar Bitácora:
{
  "areas": {
    "piscinas": {
      "BAÑOS": "E",      // E = Excelente, B = Bueno, R = Regular
      "ROMPE OLAS": "B",
      "ANDENES": "E"
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

----------------------------------------------------

// NOTAS IMPORTANTES:

// 1. ROLES REQUERIDOS:
//    - admin: Puede crear unidades, bitácoras y ver todas las bitácoras
//    - editor: Solo puede ver y llenar sus bitácoras asignadas

// 2. HEADERS OBLIGATORIOS:
//    - x-user-email: Email del usuario autenticado (todos los endpoints)
//    - x-supervisor-email: Email del supervisor (endpoints 2 y 6)

// 3. VALIDACIONES:
//    - Usuarios solo pueden acceder a datos de sus empresas
//    - Supervisores solo pueden ver sus propias bitácoras
//    - Admins pueden ver todas las bitácoras de su empresa

// 4. ESTADOS DE BITÁCORA:
//    - programada: Recién creada por admin
//    - en_progreso: Supervisor inició la supervisión
//    - completada: Supervisor terminó de llenar la bitácora
//    - cancelada: Bitácora cancelada

// 5. CALIFICACIONES DE ÁREAS:
//    - E: Excelente
//    - B: Bueno  
//    - R: Regular

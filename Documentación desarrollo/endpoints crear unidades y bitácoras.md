

--------------------------------------------------------------------------------------------
1. Endpoint para obtener el companyId de la empresa de un admin (techguardtenant@gmail.com):

Con este endpoint: GET http://50.17.36.133:8080/api/tenant/companies
                   Headers: x-user-email : techguardtenant@gmail.com

Se obtiene el _id de la empresa MARMA para crear las unidades residenciales:

					"_id": "68f2626dbc1801f5700bf858"
					
					
----------------------------------------------------------------------------------------------------				
2. Endpoint para que el admin (techguardtenant@gmail.com) cree unidades residenciales en la empresa:		

POST https://www.refactorii.com/api/tenant/unidades-residenciales

Headers

	x-user-email: techguardtenant@gmail.com
	Content-Type: application/json

Body > raw > json

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
		  "color": "#ec4899",
		  "items": ["PRODUCTIVIDAD","PRESENTACIÓN","CARNET","ELEMENTOS EPP","CONTROL DE HORARIO","ACTITUD"]
		}
	  }
	}
	
Response:  
	
	{
		"success": true,
		"message": "Unidad residencial creada exitosamente",
		"data": {
			"areas": {
				"piscinas": {
					"name": "PISCINAS",
					"color": "#3b82f6",
					"items": [
						"BAÑOS",
						"ROMPE OLAS",
						"ANDENES",
						"LAVA PIES - DUCHA",
						"SAUNA",
						"JACUZZI",
						"TURCO",
						"COLOR VISUAL",
						"PH",
						"CLORO",
						"CUARTO DE MÁQUINAS",
						"HALL"
					]
				},
				"zonas_comunes": {
					"name": "ZONAS COMUNES",
					"color": "#22c55e",
					"items": [
						"GIMNASIO",
						"SALÓN SOCIAL",
						"SALÓN DE JUEGOS",
						"ANDENES",
						"PORTERÍA",
						"PARQUEADERO"
					]
				},
				"zonas_externas": {
					"name": "ZONAS EXTERNAS",
					"color": "#f59e0b",
					"items": [
						"ZONA VERDES",
						"CAÑUELAS",
						"PARQUE INFANTIL",
						"PAREDES",
						"VIDRIOS - VENTANAS",
						"PASAMANOS",
						"TAPAS SHUT",
						"GABINETES - EXTINTORES",
						"BARRIO - TRAPEADO",
						"ASCENSORES",
						"TUBERÍA VOLÁTIL",
						"ESCALAS",
						"PISOS",
						"SHUT BASURAS"
					]
				},
				"oficinas": {
					"name": "OFICINAS",
					"color": "#8b5cf6",
					"items": [
						"ESCRITORIOS",
						"PAPELERAS",
						"SALA DE JUNTAS",
						"AULAS",
						"BAÑOS",
						"RECEPCIÓN",
						"COMPUTADORES",
						"PAREDES",
						"CIELO RASO",
						"COCINETA",
						"ENTRADAS PRINCIPAL"
					]
				},
				"operario": {
					"name": "OPERARIO",
					"color": "#ec4899",
					"items": [
						"PRODUCTIVIDAD",
						"PRESENTACIÓN",
						"CARNET",
						"ELEMENTOS EPP",
						"CONTROL DE HORARIO",
						"ACTITUD"
					]
				}
			},
			"tipo": "condominio",
			"isActive": true,
			"_id": "eeb76b27-695d-46b4-8001-49b6664307d6",
			"companyId": "68f2626dbc1801f5700bf858",
			"nombre": "Conjunto Residencial Marma",
			"direccion": "Carrera 15 #93-47, Bogotá",
			"createdAt": "2025-10-20T15:23:24.423Z",
			"updatedAt": "2025-10-20T15:23:24.423Z",
			"__v": 0
		}
	}
		
	
--------------------------------------------------------------------------------
3. Endpoint para Admin crear Bitácora de supervisión para una unidad residencial
      
	- x-user-email es el correo del administrador de la empresa  
	- Ver tabla googlesigninusers y companygooglesigninusers 		para obtener el correo del supervisor: x-editor-email
	- Ver tabla unidadresidencials 									para obtener el campo :  unidadResidencialId ---> "_id": "eeb76b27-695d-46b4-8001-49b6664307d6"  (también es entregado en el response del endpoint anterior cuando se crea la unidad residencial)

POST http://50.17.36.133:8080/api/tenant/bitacoras-supervision

Headers

	x-user-email: techguardtenant@gmail.com
	x-editor-email: wbsckt3@gmail.com
	Content-Type: application/json

Body > raw > json

	{
	  "unidadResidencialId": "eeb76b27-695d-46b4-8001-49b6664307d6",
	  "fecha": "2025-09-24T09:00:00.000Z",
	  "observaciones": "Supervisión programada para el miercoles 22 de octubre"
	}
	
Response:

	{
		"success": true,
		"message": "Bitácora de supervisión creada exitosamente",
		"data": {
			"resumen": {
				"totalAreas": 0,
				"areasCompletadas": 0,
				"totalElementos": 0,
				"elementosCompletados": 0
			},
			"metadata": {
				"demo": false,
				"timestamp": "2025-10-20T15:54:43.648Z"
			},
			"observaciones": "Supervisión programada para el miercoles 22 de octubre",
			"estado": "programada",
			"areas": {},
			"comentarios": {},
			"evidencias": {},
			"deshabilitadas": {},
			"isActive": true,
			"_id": "7f50376d-9f33-4c5c-9916-ec3aa7011dfa",
			"companyId": "68f2626dbc1801f5700bf858",
			"unidadResidencialId": "eeb76b27-695d-46b4-8001-49b6664307d6",
			"supervisorEmail": "wbsckt2@gmail.com",
			"supervisor": "wbsckt2@gmail.com",
			"cliente": "MARMA",
			"fecha": "2025-09-24T09:00:00.000Z",
			"fechaProgramada": "2025-09-24T09:00:00.000Z",
			"createdAt": "2025-10-20T15:54:43.648Z",
			"updatedAt": "2025-10-20T15:54:43.648Z",
			"__v": 0
		}
	}
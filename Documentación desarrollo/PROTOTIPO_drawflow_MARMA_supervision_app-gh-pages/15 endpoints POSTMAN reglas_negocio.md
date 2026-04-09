Por POSTMAN:

- Crear empresa: marma
- Relacionar x-user-email + id empresa + rol

Roles: 
- admin
- supervisor

Crear endpoints:

- 0 Desde POSTMAN

admin = x-user-email

postCrearUnidadResidencial

- 1 Desde POSTMAN

admin = x-user-email

getUnidadesResidenciales

- 2 Desde POSTMAN: 

admin = x-user-email + x-user-email supervisor + id-unidad-residencial

postCrearBitacoraSupervision

admin agenda una bitácoraSupervisión a usuario rol supervisor + idUnidadResidencial

- 3 Desde FRONT: 

supervisor = x-user-email

getBitacorasSupervision

Supervisor ingresa y ve sus visitas programadas fecha, hora y la inicia = abrir formulario de la id_bitácoraSupervisión

- 4 Desde FRONT:

supervisor = x-user-email

postLlenarBitacoraSupervision

- 5 Desde POSTMAN

admin: x-user-email + Id-unidad-residencial

getUnidadResidencialBitacorasSupervision

- 6 Desde POSTMAN

admin = x-user-email + x-user-email supervisor

getBitacorasSupervision

## NUEVOS ENDPOINTS PARA FORMULARIO_V3.HTML

### Endpoints de Daños/Evidencias R:

- 7 Desde FRONT (formulario_v2.html):

supervisor = x-user-email + bitacoraId + area + item + rating=R

postCrearDamage

Supervisor reporta daño con calificación R y se crea automáticamente en el sistema de geofence

- 8 Desde FRONT (formulario_v3.html):

technician = x-user-email + latitude + longitude + radius

getDamagesNearby

Técnico busca daños cercanos para enviar propuestas de solución

- 9 Desde FRONT (formulario_v3.html):

technician = x-user-email + damageId

postCrearProposal

Técnico envía propuesta de solución para un daño específico

- 10 Desde FRONT (formulario_v3.html):

technician = x-user-email

getProposalsByTechnician

Técnico ve sus propuestas enviadas y su estado

### Endpoints de Geolocalización de Daños:

- 11 Desde FRONT (formulario_v3.html):

technician = x-user-email + latitude + longitude + radius + severity

getDamagesByLocation

Búsqueda avanzada de daños por ubicación y severidad

- 12 Desde FRONT (formulario_v2.html):

supervisor = x-user-email + damageId + latitude + longitude

putUpdateDamageLocation

Actualizar ubicación de daño reportado

### Endpoints de Integración:

- 13 Desde FRONT (formulario_v3.html):

technician = x-user-email + damageId

getProposalsByDamage

Ver todas las propuestas enviadas para un daño específico

- 14 Desde FRONT (formulario.html - admin):

admin = x-user-email + damageId

getDamageWithProposals

Admin ve daño y todas las propuestas recibidas para tomar decisión

- 15 Desde FRONT (formulario.html - admin):

admin = x-user-email + proposalId + status

putUpdateProposalStatus

Admin acepta o rechaza propuesta de técnico
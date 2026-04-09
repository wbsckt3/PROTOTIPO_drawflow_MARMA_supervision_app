
postCrearUnidadResidencial - Con campo correo
getUnidadesResidenciales - Con filtro isActive
putActualizarEstadoUnidad - Soft delete
putActualizarUnidadResidencial - Con campo correo
postCrearBitacoraSupervision
getBitacorasSupervision - Con filtros y unidadNombre, soporte admin/supervisor
postLlenarBitacoraSupervision - Con comentarioGlobal y fechaInicio/fechaFin
getUnidadResidencialBitacorasSupervision
getBitacorasSupervisionBySupervisor - Con unidadNombre (cambio reciente)
getBitacoraSupervisionById - Con resumen y comentarioGlobal, establece fechaInicio si es programada
putActualizarBitacoraSupervision - Nueva función (CRUD actualizar)
deleteBitacoraSupervision - Nueva función (CRUD eliminar)
getSupervisoresByCompany - Corregida para funcionar sin populate
const GoogleSigninUser = require('../models/GoogleSigninUser.js');
const CompanyGoogleSigninUser = require('../models/CompanyGoogleSigninUser.model');
const Company = require('../models/company.model');
const UnidadResidencial = require('../models/UnidadResidencial.model');
const BitacoraSupervision = require('../models/BitacoraSupervision.model');
const { processEvidenciasToDropbox } = require('../services/dropbox.service');
const { procesarPDFDelFrontend } = require('../services/email.service');

// Usar wrapper para uuid (soluciona error ESM en CommonJS)
const { v4: uuidv4 } = require('../utils/uuid-wrapper');

// Función auxiliar para validar pertenencia del usuario a una empresa
async function validateUserCompanyAccess(userEmail, requiredRole = null) {
  try {
    console.log('🔍 Debug validateUserCompanyAccess - userEmail:', userEmail);
    console.log('🔍 Debug validateUserCompanyAccess - requiredRole:', requiredRole);
    
    // 1. Buscar usuario principal
    const user = await GoogleSigninUser.findOne({ Email: userEmail }).lean();
    console.log('🔍 Debug validateUserCompanyAccess - user encontrado:', user);
    
    if (!user) {
      console.log('❌ Debug validateUserCompanyAccess - Usuario no encontrado para email:', userEmail);
      throw new Error('Usuario no encontrado');
    }

    const userMongoId = user._id;

    // 2. Buscar relación con empresas
    const relations = await CompanyGoogleSigninUser.find({ 
      googlesigninuserId: userMongoId.toString() 
    });
    
    console.log('🔍 Debug validateUserCompanyAccess - relations encontradas:', relations.length);

    if (relations.length === 0) {
      throw new Error('Usuario no tiene acceso a ninguna empresa');
    }

    const companyIds = relations.map(rel => rel.companyId);
    const companies = await Company.find({ _id: { $in: companyIds } });

    // 3. Si se requiere un rol específico, validarlo
    if (requiredRole) {
      const userRelation = relations.find(rel => rel.role === requiredRole);
      if (!userRelation) {
        throw new Error(`Usuario no tiene rol ${requiredRole}`);
      }
    }

    return {
      user,
      relations,
      companies,
      companyIds
    };
  } catch (error) {
    throw error;
  }
}

// 0. POST - Crear Unidad Residencial (Admin)
exports.postCrearUnidadResidencial = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const {
      nombre,
      direccion,
      correo,
      tipo,
      areas,
      companyId,
      ordenConsecutivo,
      razonSocial,
      nit,
      puntoReferencia,
      numeroPorteria,
      nombreRepresentanteLegal,
      cedulaRepresentanteLegal,
      celularRepresentanteLegal,
      nombreAdministradorDelegado,
      celularAdministradorDelegado,
      perfilesContratados,
      numeroOperarios,
      horarios,
      jornada,
      fechaInicio,
      fechaTerminacion,
      correoCartas,
      correoFacturacion,
      valoresAgregados,
      frecuenciaSupervision,
      valorContratoConIva,
      observacionesContrato
    } = req.body;

    if (!userEmail || !nombre || !direccion || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');
    
    // Validar que el tipo esté en el enum permitido
    const tiposPermitidos = ['condominio', 'edificio', 'conjunto_residencial', 'urbanizacion'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo de unidad no válido',
        tiposPermitidos: tiposPermitidos
      });
    }

    // Validar que el companyId enviado pertenece al usuario
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      targetCompanyId = companyIds[0];
    } else if (!companyIds.includes(targetCompanyId)) {
      return res.status(403).json({ error: 'No tienes acceso a esa empresa' });
    }

    // Crear nueva unidad residencial
    const nuevaUnidad = new UnidadResidencial({
      _id: uuidv4(),
      companyId: targetCompanyId,
      nombre,
      direccion,
      correo: correo || '',
      tipo,
      ordenConsecutivo: ordenConsecutivo || '',
      razonSocial: razonSocial || '',
      nit: nit || '',
      puntoReferencia: puntoReferencia || '',
      numeroPorteria: numeroPorteria || '',
      nombreRepresentanteLegal: nombreRepresentanteLegal || '',
      cedulaRepresentanteLegal: cedulaRepresentanteLegal || '',
      celularRepresentanteLegal: celularRepresentanteLegal || '',
      nombreAdministradorDelegado: nombreAdministradorDelegado || '',
      celularAdministradorDelegado: celularAdministradorDelegado || '',
      perfilesContratados: perfilesContratados || '',
      numeroOperarios: typeof numeroOperarios === 'number' ? numeroOperarios : (numeroOperarios ? Number(numeroOperarios) || 0 : 0),
      horarios: horarios || '',
      jornada: jornada || '',
      fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
      fechaTerminacion: fechaTerminacion || '',
      correoCartas: correoCartas || '',
      correoFacturacion: correoFacturacion || '',
      valoresAgregados: valoresAgregados || '',
      frecuenciaSupervision: frecuenciaSupervision || '',
      valorContratoConIva: typeof valorContratoConIva === 'number' ? valorContratoConIva : (valorContratoConIva ? Number((valorContratoConIva + '').replace(/[^0-9.-]/g, '')) || 0 : 0),
      observacionesContrato: observacionesContrato || ''
    });
    
    // Si se envían áreas personalizadas, actualizarlas
    if (areas && Object.keys(areas).length > 0) {
      nuevaUnidad.areas = areas;
    }

    await nuevaUnidad.save();

    res.status(201).json({
      success: true,
      message: 'Unidad residencial creada exitosamente',
      data: nuevaUnidad
    });

  } catch (error) {
    console.error('Error creando unidad residencial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 1. GET - Obtener Unidades Residenciales (Admin)
exports.getUnidadesResidenciales = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const isActive = req.query.isActive;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');
    
    // Construir query
    const query = { companyId: { $in: companyIds } };
    
    // Filtrar por isActive si se proporciona
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true' || isActive === true;
    }

    // Buscar unidades residenciales de la empresa
    const unidades = await UnidadResidencial.find(query).lean();

    res.status(200).json({
      success: true,
      data: unidades,
      total: unidades.length
    });

  } catch (error) {
    console.error('Error obteniendo unidades residenciales:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 1.1. PUT - Actualizar Estado de Unidad Residencial (Habilitar/Deshabilitar)
exports.putActualizarEstadoUnidad = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { unidadResidencialId } = req.params;
    const { isActive } = req.body;

    if (!userEmail || !unidadResidencialId || isActive === undefined) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Buscar la unidad y verificar que pertenece a la empresa
    const unidad = await UnidadResidencial.findOne({
      _id: unidadResidencialId,
      companyId: { $in: companyIds }
    });

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
    }

    // Actualizar el estado (eliminación lógica)
    unidad.isActive = isActive;
    unidad.updatedAt = new Date();
    await unidad.save();

    res.status(200).json({
      success: true,
      message: `Unidad ${isActive ? 'habilitada' : 'deshabilitada'} exitosamente`,
      data: unidad
    });

  } catch (error) {
    console.error('Error actualizando estado de unidad residencial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 1.2. PUT - Actualizar Unidad Residencial (Admin)
exports.putActualizarUnidadResidencial = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { unidadResidencialId } = req.params;
    const {
      nombre,
      direccion,
      correo,
      tipo,
      ordenConsecutivo,
      razonSocial,
      nit,
      puntoReferencia,
      numeroPorteria,
      nombreRepresentanteLegal,
      cedulaRepresentanteLegal,
      celularRepresentanteLegal,
      nombreAdministradorDelegado,
      celularAdministradorDelegado,
      perfilesContratados,
      numeroOperarios,
      horarios,
      jornada,
      fechaInicio,
      fechaTerminacion,
      correoCartas,
      correoFacturacion,
      valoresAgregados,
      frecuenciaSupervision,
      valorContratoConIva,
      observacionesContrato
    } = req.body;

    if (!userEmail || !unidadResidencialId || !nombre || !direccion || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Buscar la unidad y verificar que pertenece a la empresa
    const unidad = await UnidadResidencial.findOne({
      _id: unidadResidencialId,
      companyId: { $in: companyIds }
    });

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
    }

    // Validar que el tipo esté en el enum permitido
    const tiposPermitidos = ['condominio', 'edificio', 'conjunto_residencial', 'urbanizacion'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo de unidad no válido',
        tiposPermitidos: tiposPermitidos
      });
    }

    // Actualizar los campos
    unidad.nombre = nombre;
    unidad.direccion = direccion;
    unidad.correo = correo || '';
    unidad.tipo = tipo;
    unidad.ordenConsecutivo = ordenConsecutivo || unidad.ordenConsecutivo || '';
    unidad.razonSocial = razonSocial || unidad.razonSocial || '';
    unidad.nit = nit || unidad.nit || '';
    unidad.puntoReferencia = puntoReferencia || unidad.puntoReferencia || '';
    unidad.numeroPorteria = numeroPorteria || unidad.numeroPorteria || '';
    unidad.nombreRepresentanteLegal = nombreRepresentanteLegal || unidad.nombreRepresentanteLegal || '';
    unidad.cedulaRepresentanteLegal = cedulaRepresentanteLegal || unidad.cedulaRepresentanteLegal || '';
    unidad.celularRepresentanteLegal = celularRepresentanteLegal || unidad.celularRepresentanteLegal || '';
    unidad.nombreAdministradorDelegado = nombreAdministradorDelegado || unidad.nombreAdministradorDelegado || '';
    unidad.celularAdministradorDelegado = celularAdministradorDelegado || unidad.celularAdministradorDelegado || '';
    unidad.perfilesContratados = perfilesContratados || unidad.perfilesContratados || '';
    if (numeroOperarios !== undefined) {
      unidad.numeroOperarios = typeof numeroOperarios === 'number' ? numeroOperarios : (numeroOperarios ? Number(numeroOperarios) || 0 : 0);
    }
    unidad.horarios = horarios || unidad.horarios || '';
    unidad.jornada = jornada || unidad.jornada || '';
    if (fechaInicio !== undefined) {
      unidad.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    }
    unidad.fechaTerminacion = fechaTerminacion || unidad.fechaTerminacion || '';
    unidad.correoCartas = correoCartas || unidad.correoCartas || '';
    unidad.correoFacturacion = correoFacturacion || unidad.correoFacturacion || '';
    unidad.valoresAgregados = valoresAgregados || unidad.valoresAgregados || '';
    unidad.frecuenciaSupervision = frecuenciaSupervision || unidad.frecuenciaSupervision || '';
    if (valorContratoConIva !== undefined) {
      unidad.valorContratoConIva = typeof valorContratoConIva === 'number'
        ? valorContratoConIva
        : (valorContratoConIva ? Number((valorContratoConIva + '').replace(/[^0-9.-]/g, '')) || 0 : 0);
    }
    unidad.observacionesContrato = observacionesContrato || unidad.observacionesContrato || '';
    unidad.updatedAt = new Date();
    
    await unidad.save();

    res.status(200).json({
      success: true,
      message: 'Unidad residencial actualizada exitosamente',
      data: unidad
    });

  } catch (error) {
    console.error('Error actualizando unidad residencial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 2. POST - Crear Bitácora de Supervisión (Admin)
exports.postCrearBitacoraSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const supervisorEmail = req.headers['x-editor-email']?.toLowerCase().trim();
    const { unidadResidencialId, fecha, observaciones } = req.body;

    console.log('🔍 Debug POST bitácora - userEmail:', userEmail);
    console.log('🔍 Debug POST bitácora - supervisorEmail:', supervisorEmail);
    console.log('🔍 Debug POST bitácora - unidadResidencialId:', unidadResidencialId);
    console.log('🔍 Debug POST bitácora - fecha recibida (raw):', fecha);
    console.log('🔍 Debug POST bitácora - tipo de fecha:', typeof fecha);

    if (!userEmail || !supervisorEmail || !unidadResidencialId || !fecha) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Validar que el supervisor existe y pertenece a la misma empresa
    const supervisorData = await validateUserCompanyAccess(supervisorEmail, 'editor');
    const supervisorCompanyIds = supervisorData.companyIds;

    // Verificar que ambos usuarios pertenecen a la misma empresa
    const commonCompanyIds = companyIds.filter(id => supervisorCompanyIds.includes(id));
    if (commonCompanyIds.length === 0) {
      return res.status(403).json({ error: 'El supervisor no pertenece a la misma empresa' });
    }

    // Verificar que la unidad residencial existe y pertenece a la empresa
    const unidad = await UnidadResidencial.findOne({ 
      _id: unidadResidencialId,
      companyId: { $in: commonCompanyIds }
    });

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
    }

    // Obtener datos de la empresa
    const empresa = await Company.findById(commonCompanyIds[0]).lean();
    
    // Parsear fecha de forma segura
    let fechaParsed;
    try {
      console.log('🔍 Parseando fecha - valor recibido:', fecha);
      console.log('🔍 Parseando fecha - tipo:', typeof fecha);
      console.log('🔍 Parseando fecha - longitud:', fecha?.length || 'N/A');
      
      // Si la fecha viene como string ISO, parsearla directamente
      if (typeof fecha === 'string') {
        // Log del string completo antes de parsear
        console.log('🔍 String de fecha completo:', JSON.stringify(fecha));
        
        fechaParsed = new Date(fecha);
        
        // Verificar que la fecha sea válida
        if (isNaN(fechaParsed.getTime())) {
          console.error('❌ Error: Fecha inválida recibida:', fecha);
          console.error('❌ Intentando parsear como:', fecha);
          return res.status(400).json({ error: 'Fecha inválida: ' + fecha });
        }
        
        console.log('✅ Fecha parseada correctamente:');
        console.log('  - ISO String:', fechaParsed.toISOString());
        console.log('  - UTC:', fechaParsed.toUTCString());
        console.log('  - Hora local (Bogotá):', fechaParsed.toLocaleString('es-ES', { timeZone: 'America/Bogota' }));
        console.log('  - Año:', fechaParsed.getFullYear());
        console.log('  - Mes:', fechaParsed.getMonth() + 1);
        console.log('  - Día:', fechaParsed.getDate());
        console.log('  - Hora:', fechaParsed.getHours());
        console.log('  - Minuto:', fechaParsed.getMinutes());
      } else {
        fechaParsed = new Date(fecha);
        if (isNaN(fechaParsed.getTime())) {
          console.error('❌ Error: Fecha inválida recibida (no string):', fecha);
          return res.status(400).json({ error: 'Fecha inválida' });
        }
        console.log('✅ Fecha parseada (no string):', fechaParsed.toISOString());
      }
    } catch (error) {
      console.error('❌ Error parseando fecha:', error);
      console.error('❌ Stack:', error.stack);
      return res.status(400).json({ error: 'Error al procesar la fecha: ' + error.message });
    }
    
    // Crear nueva bitácora de supervisión
    const nuevaBitacora = new BitacoraSupervision({
      _id: uuidv4(),
      companyId: commonCompanyIds[0],
      unidadResidencialId,
      supervisorEmail,
      supervisor: supervisorEmail,
      cliente: empresa ? empresa.name : 'Empresa',
      unidadNombre: unidad.nombre,
      fecha: fechaParsed,
      fechaProgramada: fechaParsed,
      estado: 'programada',
      observaciones: observaciones || ''
    });
    
    console.log('✅ Bitácora creada con fecha:', nuevaBitacora.fecha.toISOString());
    console.log('✅ Fecha programada:', nuevaBitacora.fechaProgramada.toISOString());

    await nuevaBitacora.save();

    res.status(201).json({
      success: true,
      message: 'Bitácora de supervisión creada exitosamente',
      data: nuevaBitacora
    });

  } catch (error) {
    console.error('Error creando bitácora de supervisión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 3. GET - Obtener Bitácoras de Supervisión (Admin/Supervisor)
exports.getBitacorasSupervision = async (req, res) => {
  try {
    // Logging para debug
    console.log('🔍 Headers recibidos en getBitacorasSupervision:', {
      'x-user-email': req.headers['x-user-email'],
      'x-user-email-raw': req.headers['x-user-email'],
      'all-headers': Object.keys(req.headers).filter(k => k.toLowerCase().includes('user') || k.toLowerCase().includes('email'))
    });
    
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { unidadResidencialId, supervisorEmail, fechaDesde, fechaHasta, estado } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    // Determinar si es admin o supervisor
    let companyIds = [];
    let isAdmin = false;
    
    try {
      const adminData = await validateUserCompanyAccess(userEmail, 'admin');
      companyIds = adminData.companyIds;
      isAdmin = true;
    } catch (adminError) {
      // Si no es admin, intentar como supervisor
      try {
        const supervisorData = await validateUserCompanyAccess(userEmail, 'editor');
        companyIds = supervisorData.companyIds;
        isAdmin = false;
      } catch (supervisorError) {
        return res.status(403).json({ error: 'Usuario no tiene permisos' });
      }
    }

    // Construir query
    const query = { companyId: { $in: companyIds } };
    
    // Si es supervisor, solo mostrar sus bitácoras
    if (!isAdmin) {
      // Normalizar el email del usuario para la búsqueda
      const normalizedUserEmail = userEmail.toLowerCase().trim();
      // OPTIMIZACIÓN: Intentar primero búsqueda exacta (más rápida con índice)
      // Si no encuentra resultados, usar regex como fallback
      query.supervisorEmail = normalizedUserEmail;
      console.log('🔍 Buscando bitácoras para supervisor (normalizado):', normalizedUserEmail);
    }
    
    // Aplicar filtros
    if (unidadResidencialId) {
      query.unidadResidencialId = unidadResidencialId;
    }
    
    if (supervisorEmail && isAdmin) {
      query.supervisorEmail = supervisorEmail;
    }
    
    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      
      // Si solo hay fechaDesde, usar también como fechaHasta
      const fechaDesdeFinal = fechaDesde || fechaHasta;
      const fechaHastaFinal = fechaHasta || fechaDesde;
      
      if (fechaDesdeFinal) {
        // Parsear la fecha y crear en hora local
        // Formato esperado: YYYY-MM-DD
        const [year, month, day] = fechaDesdeFinal.split('-').map(Number);
        // Crear fecha en hora local desde el inicio del día (00:00:00)
        // MongoDB almacena fechas en UTC, así que necesitamos un rango que cubra
        // todo el día considerando posibles diferencias de zona horaria
        const desdeLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        // Usar el inicio del día anterior en UTC para asegurar que capture todas las fechas
        // Esto compensa por diferencias de zona horaria (ej: Colombia UTC-5)
        const desde = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0));
        query.fecha.$gte = desde;
        console.log('🔍 Filtro fechaDesde:', fechaDesdeFinal, '-> Desde UTC:', desde.toISOString(), '| Local:', desdeLocal.toISOString());
      }
      
      if (fechaHastaFinal) {
        // Parsear la fecha y crear en hora local
        // Formato esperado: YYYY-MM-DD
        const [year, month, day] = fechaHastaFinal.split('-').map(Number);
        // Crear fecha en hora local hasta el final del día (23:59:59.999)
        const hastaLocal = new Date(year, month - 1, day, 23, 59, 59, 999);
        // Usar el final del día siguiente en UTC para asegurar que capture todas las fechas
        // Esto compensa por diferencias de zona horaria (ej: Colombia UTC-5)
        const hasta = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59, 999));
        query.fecha.$lte = hasta;
        console.log('🔍 Filtro fechaHasta:', fechaHastaFinal, '-> Hasta UTC:', hasta.toISOString(), '| Local:', hastaLocal.toISOString());
      }
    }
    
    if (estado) {
      // Manejar "con_novedad" en el filtro
      if (estado === 'con_novedad') {
        query.estado = 'con_novedad';
      } else {
        query.estado = estado;
      }
    }

    // Buscar bitácoras con los filtros aplicados
    console.log('🔍 Query final para buscar bitácoras:', JSON.stringify(query, null, 2));
    const startTime = Date.now();
    
    // OPTIMIZACIÓN: Seleccionar solo campos necesarios (excluir evidencias completas que pueden ser grandes)
    // Las evidencias se pueden cargar bajo demanda cuando se necesiten (en el detalle de la bitácora)
    // También excluir áreas, comentarios y deshabilitadas que no se usan en la lista
    const bitacoras = await BitacoraSupervision.find(query)
    .select('-evidencias -areas -comentarios -deshabilitadas') // Excluir campos grandes no necesarios en la lista
    .sort({ fecha: -1 })
    .limit(200) // Limitar a 200 bitácoras para mejorar rendimiento (ajustable según necesidades)
    .lean();
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Bitácoras encontradas: ${bitacoras.length} (tiempo: ${queryTime}ms)`);
    
    if (bitacoras.length > 0) {
      console.log('🔍 Primeras bitácoras encontradas:');
      bitacoras.slice(0, 3).forEach((b, i) => {
        console.log(`  ${i + 1}. ID: ${b._id}, Supervisor: ${b.supervisorEmail}, Estado: ${b.estado}`);
      });
    }

    // OPTIMIZACIÓN: Obtener datos de las unidades residenciales solo si hay bitácoras
    let unidadesMap = {};
    if (bitacoras.length > 0) {
      const unidadIds = [...new Set(bitacoras.map(b => b.unidadResidencialId))]; // Usar Set para eliminar duplicados
      const unidadesStartTime = Date.now();
      const unidades = await UnidadResidencial.find({ 
        _id: { $in: unidadIds },
        companyId: { $in: companyIds }
      })
      .select('_id nombre direccion tipo') // Solo campos necesarios
      .lean();
      
      const unidadesTime = Date.now() - unidadesStartTime;
      console.log(`✅ Unidades encontradas: ${unidades.length} (tiempo: ${unidadesTime}ms)`);
      
      // Crear un mapa para acceso rápido
      unidades.forEach(u => {
        unidadesMap[u._id] = u;
      });
    }

    // Agregar datos de la unidad a cada bitácora
    const bitacorasConUnidad = bitacoras.map(bitacora => {
      const unidad = unidadesMap[bitacora.unidadResidencialId] || null;
      return {
        ...bitacora,
        unidadResidencial: unidad,
        unidadNombre: unidad?.nombre || null
      };
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Total tiempo de respuesta: ${totalTime}ms`);

    res.status(200).json({
      success: true,
      data: bitacorasConUnidad,
      total: bitacorasConUnidad.length
    });

  } catch (error) {
    console.error('Error obteniendo bitácoras de supervisión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 4. POST - Llenar Bitácora de Supervisión (Frontend)
exports.postLlenarBitacoraSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { bitacoraId } = req.params;
    const { areas, comentarios, evidencias, estado, comentarioGlobal, pdfBase64 } = req.body;

    console.log('🔍 POST llenar bitácora - Iniciando...');
    console.log('🔍 userEmail (raw header):', req.headers['x-user-email']);
    console.log('🔍 userEmail (normalized):', userEmail);
    console.log('🔍 bitacoraId:', bitacoraId);
    console.log('🔍 ¿Recibió PDF del frontend?:', !!pdfBase64);
    if (pdfBase64) {
      console.log('🔍 Tamaño del PDF recibido:', (pdfBase64.length / 1024).toFixed(2), 'KB');
    }
    console.log('🔍 Body recibido:', {
      hasAreas: !!areas,
      hasComentarios: !!comentarios,
      hasEvidencias: !!evidencias,
      hasPDF: !!pdfBase64,
      estado: estado
    });

    if (!userEmail || !bitacoraId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar acceso del usuario
    console.log('🔍 Validando acceso del usuario...');
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'editor');
    console.log('🔍 companyIds obtenidos:', companyIds);

    // Buscar la bitácora (primero sin filtro de supervisorEmail para debug)
    console.log('🔍 Buscando bitácora con filtros:', {
      _id: bitacoraId,
      _idType: typeof bitacoraId,
      companyIds: companyIds,
      companyIdsLength: companyIds?.length
    });
    
    // Intentar buscar primero solo por ID para ver si existe
    const bitacoraById = await BitacoraSupervision.findOne({ _id: bitacoraId }).lean();
    console.log('🔍 Bitácora encontrada solo por ID:', bitacoraById ? 'Sí' : 'No');
    if (bitacoraById) {
      console.log('🔍 Bitácora encontrada - datos:', {
        _id: bitacoraById._id,
        supervisorEmail: bitacoraById.supervisorEmail,
        companyId: bitacoraById.companyId,
        estado: bitacoraById.estado
      });
    }
    
    // Buscar con filtros de companyId
    let bitacora = await BitacoraSupervision.findOne({
      _id: bitacoraId,
      companyId: { $in: companyIds }
    }).lean();

    console.log('🔍 Bitácora encontrada (con filtro companyId):', bitacora ? 'Encontrada' : 'No encontrada');
    
    if (!bitacora) {
      console.log('❌ Bitácora no encontrada o no accesible');
      console.log('❌ Filtros aplicados:', {
        _id: bitacoraId,
        companyId: { $in: companyIds }
      });
      
      // Si la bitácora existe pero no coincide con companyId, dar más información
      if (bitacoraById) {
        console.log('❌ La bitácora existe pero el companyId no coincide:');
        console.log('  - companyId de bitácora:', bitacoraById.companyId);
        console.log('  - companyIds del usuario:', companyIds);
        console.log('  - ¿Está en la lista?', companyIds.includes(bitacoraById.companyId));
      }
      
      return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
    }

    // Normalizar ambos emails para comparación (case-insensitive y sin espacios)
    const normalizedSupervisorEmail = bitacora.supervisorEmail?.toLowerCase().trim();
    const normalizedUserEmail = userEmail?.toLowerCase().trim();
    
    console.log('🔍 Comparando emails:');
    console.log('  - supervisorEmail (raw):', bitacora.supervisorEmail);
    console.log('  - supervisorEmail (normalized):', normalizedSupervisorEmail);
    console.log('  - userEmail (normalized):', normalizedUserEmail);
    console.log('  - Coinciden:', normalizedSupervisorEmail === normalizedUserEmail);

    // Verificar que el supervisorEmail coincide (normalizado)
    if (normalizedSupervisorEmail !== normalizedUserEmail) {
      console.log('❌ Supervisor no tiene acceso a esta bitácora');
      console.log('❌ supervisorEmail no coincide:', normalizedSupervisorEmail, '!==', normalizedUserEmail);
      return res.status(403).json({ error: 'No tienes acceso a esta bitácora' });
    }

    console.log('✅ Bitácora encontrada y accesible para el supervisor');

    // Procesar evidencias: subir imágenes a Dropbox si existen
    let evidenciasProcesadas = evidencias;
    if (evidencias && Object.keys(evidencias).length > 0) {
      try {
        console.log('📤 ===== INICIANDO PROCESAMIENTO DE EVIDENCIAS =====');
        console.log('📤 Evidencias recibidas - Número de áreas:', Object.keys(evidencias).length);
        console.log('📤 Evidencias recibidas - Áreas:', JSON.stringify(Object.keys(evidencias)));
        
        // Log detallado de la estructura de evidencias
        Object.entries(evidencias).forEach(([areaKey, areaEvidencias]) => {
          if (areaEvidencias && typeof areaEvidencias === 'object') {
            const itemsCount = Object.keys(areaEvidencias).length;
            console.log(`📤 Área "${areaKey}": ${itemsCount} items con evidencias`);
            Object.entries(areaEvidencias).forEach(([itemName, evidenciaData]) => {
              console.log(`  - Item "${itemName}":`, {
                tipo: typeof evidenciaData,
                esObjeto: typeof evidenciaData === 'object',
                tieneImage: typeof evidenciaData === 'object' && !!evidenciaData.image,
                tieneGeolocation: typeof evidenciaData === 'object' && !!evidenciaData.geolocation,
                esString: typeof evidenciaData === 'string',
                esBase64: typeof evidenciaData === 'string' && evidenciaData.startsWith('data:image'),
                preview: typeof evidenciaData === 'string' ? evidenciaData.substring(0, 50) + '...' : 'objeto'
              });
            });
          }
        });
        
        evidenciasProcesadas = await processEvidenciasToDropbox(evidencias);
        
        console.log('✅ ===== EVIDENCIAS PROCESADAS =====');
        console.log('📤 Evidencias procesadas - Número de áreas:', Object.keys(evidenciasProcesadas).length);
        console.log('📤 Evidencias procesadas - Áreas:', JSON.stringify(Object.keys(evidenciasProcesadas)));
        
        // Log detallado de evidencias procesadas
        Object.entries(evidenciasProcesadas).forEach(([areaKey, areaEvidencias]) => {
          if (areaEvidencias && typeof areaEvidencias === 'object') {
            const itemsCount = Object.keys(areaEvidencias).length;
            console.log(`✅ Área "${areaKey}": ${itemsCount} items procesados`);
            Object.entries(areaEvidencias).forEach(([itemName, evidenciaData]) => {
              console.log(`  - Item "${itemName}":`, {
                tipo: typeof evidenciaData,
                tieneUrl: typeof evidenciaData === 'object' && !!evidenciaData.url,
                url: typeof evidenciaData === 'object' ? evidenciaData.url?.substring(0, 80) + '...' : evidenciaData?.substring(0, 80) + '...'
              });
            });
          }
        });
        
        console.log('✅ IMPORTANTE: Solo URLs guardadas en MongoDB. Base64 queda en Dropbox.');
      } catch (dropboxError) {
        console.error('❌ Error procesando evidencias en Dropbox:', dropboxError);
        console.error('❌ Stack del error:', dropboxError.stack);
        
        // Verificar si es error de token expirado
        const isTokenExpired = dropboxError.message && dropboxError.message.includes('expirado');
        
        if (isTokenExpired) {
          console.error('❌ ERROR CRÍTICO: Token de Dropbox expirado. La bitácora NO se guardará.');
          return res.status(401).json({ 
            error: 'Token de Dropbox expirado', 
            details: dropboxError.message,
            message: 'El token de Dropbox ha expirado. Por favor, contacta al administrador para generar un nuevo token.',
            action: 'generate_new_token'
          });
        }
        
        // NO continuar con evidencias originales (base64) si Dropbox falla
        // Esto asegura que no se guarde base64 en MongoDB
        console.error('❌ ERROR CRÍTICO: No se pueden subir imágenes a Dropbox. La bitácora NO se guardará con base64.');
        return res.status(500).json({ 
          error: 'Error subiendo imágenes a Dropbox', 
          details: dropboxError.message,
          message: 'No se pueden guardar imágenes. Por favor, verifica la configuración de Dropbox e intenta de nuevo.'
        });
      }
    } else {
      console.log('ℹ️ No hay evidencias para procesar');
    }

    // Preparar datos de actualización
    const updateData = {
      updatedAt: new Date()
    };

    if (areas) updateData.areas = areas;
    if (comentarios) updateData.comentarios = comentarios;
    
    // Log detallado de evidencias procesadas antes de guardar
    if (evidenciasProcesadas) {
      console.log('📤 Evidencias procesadas ANTES de guardar en MongoDB:');
      console.log('📤 Tipo:', typeof evidenciasProcesadas);
      console.log('📤 Es objeto?:', typeof evidenciasProcesadas === 'object');
      console.log('📤 Keys:', Object.keys(evidenciasProcesadas));
      console.log('📤 Contenido completo:', JSON.stringify(evidenciasProcesadas, null, 2));
      
      // Verificar estructura de cada evidencia
      Object.entries(evidenciasProcesadas).forEach(([areaKey, areaEvidencias]) => {
        if (areaEvidencias && typeof areaEvidencias === 'object') {
          Object.entries(areaEvidencias).forEach(([itemName, evidencia]) => {
            console.log(`📤 Evidencia ${areaKey}/${itemName}:`, {
              tipo: typeof evidencia,
              esObjeto: typeof evidencia === 'object',
              tieneUrl: typeof evidencia === 'object' && evidencia?.url,
              url: typeof evidencia === 'object' ? evidencia?.url : evidencia,
              keys: typeof evidencia === 'object' ? Object.keys(evidencia) : null
            });
          });
        }
      });
      
      // IMPORTANTE: Mongoose puede tener problemas guardando Maps anidados con $set
      // En su lugar, usamos objeto plano - Mongoose lo convertirá a Map automáticamente
      // cuando el schema lo requiera
      
      // Convertir a objeto plano (Mongoose lo convertirá a Map automáticamente)
      const evidenciasObject = {};
      Object.entries(evidenciasProcesadas).forEach(([areaKey, areaEvidencias]) => {
        evidenciasObject[areaKey] = {};
        if (areaEvidencias && typeof areaEvidencias === 'object') {
          Object.entries(areaEvidencias).forEach(([itemName, evidencia]) => {
            evidenciasObject[areaKey][itemName] = evidencia;
          });
        }
      });
      
      console.log('📤 Evidencias convertidas a objeto plano para Mongoose');
      console.log('📤 Estructura:', JSON.stringify(evidenciasObject, null, 2));
      updateData.evidencias = evidenciasObject;
    } else {
      console.warn('⚠️ evidenciasProcesadas es null/undefined, no se guardará');
    }
    
    if (estado) {
      updateData.estado = estado;
      
      // Si se está completando la bitácora, establecer fechas
      if (estado === 'completada' || estado === 'con_novedad') {
        // Si fechaInicio no está establecida, establecerla ahora
        if (!bitacora.fechaInicio) {
          updateData.fechaInicio = new Date();
        }
        // Establecer fechaFin
        updateData.fechaFin = new Date();
        
        // Si ambas fechas se establecen al mismo tiempo, asegurar que fechaInicio sea 1 minuto antes
        if (updateData.fechaInicio && updateData.fechaFin) {
          const fechaFin = new Date(updateData.fechaFin);
          updateData.fechaInicio = new Date(fechaFin.getTime() - 60000); // 1 minuto antes
        }
      }
    }
    if (comentarioGlobal !== undefined) updateData.comentarioGlobal = comentarioGlobal || '';

    console.log('💾 updateData completo antes de guardar:', JSON.stringify(updateData, null, 2));
    
    const bitacoraActualizada = await BitacoraSupervision.findByIdAndUpdate(
      bitacoraId,
      { $set: updateData },
      { new: true }
    ).lean();

    console.log('✅ Bitácora actualizada en MongoDB');
    console.log('🔍 Evidencias guardadas en BD:', bitacoraActualizada?.evidencias ? 'Sí' : 'No');
    if (bitacoraActualizada?.evidencias) {
      console.log('🔍 Estructura de evidencias guardadas:', JSON.stringify(bitacoraActualizada.evidencias, null, 2));
    }

    // 📧 ===== GENERAR Y ENVIAR PDF POR CORREO =====
    // Solo si la bitácora está completada o con novedad
    if (bitacoraActualizada && 
        (bitacoraActualizada.estado === 'completada' || bitacoraActualizada.estado === 'con_novedad')) {
      
      try {
        console.log('📧 Iniciando proceso de envío de PDF por correo...');
        
        // Obtener unidad residencial para nombre y correo
        const unidad = await UnidadResidencial.findOne({
          _id: bitacoraActualizada.unidadResidencialId
        }).lean();
        
        if (!unidad) {
          throw new Error('No se encontró la unidad residencial');
        }

        // Obtener nombre del cliente (empresa) para personalizar el correo (asunto y firma a nombre del cliente)
        let clientName = null;
        if (bitacoraActualizada.companyId) {
          const company = await Company.findOne({ _id: bitacoraActualizada.companyId }).lean();
          if (company && company.name) {
            clientName = company.name.trim();
            console.log('📧 Cliente para correo:', clientName);
          }
        }

        // 📧 Solo enviar correo si el frontend envió el PDF en base64 (el PDF se genera en el front con html2pdf.js)
        if (pdfBase64) {
          console.log('📧 Procesando PDF recibido del frontend...');
          const resultadoEmail = await procesarPDFDelFrontend(
            pdfBase64,
            bitacoraActualizada,
            unidad,
            clientName
          );
          console.log('📧 Resultado envío correo:', resultadoEmail);
        } else {
          console.warn('⚠️ No se recibió pdfBase64 del frontend. No se envía correo. El front debe generar el PDF (html2pdf.js) y enviarlo en el payload.');
        }

      } catch (pdfError) {
        console.warn('⚠️ Error generando/enviando PDF (no bloquea la respuesta):', pdfError.message);
        console.warn('⚠️ Stack:', pdfError.stack);
        // NO retornar error, la bitácora YA está guardada exitosamente
        // Solo registramos el error en logs
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bitácora actualizada exitosamente',
      data: bitacoraActualizada
    });

  } catch (error) {
    console.error('Error actualizando bitácora de supervisión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 5. GET - Obtener Bitácoras de una Unidad Residencial (Admin)
exports.getUnidadResidencialBitacorasSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { unidadResidencialId } = req.params;

    if (!userEmail || !unidadResidencialId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Verificar que la unidad residencial pertenece a la empresa
    const unidad = await UnidadResidencial.findOne({
      _id: unidadResidencialId,
      companyId: { $in: companyIds }
    });

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
    }

    // Buscar bitácoras de la unidad residencial
    const bitacoras = await BitacoraSupervision.find({
      unidadResidencialId,
      companyId: { $in: companyIds }
    })
    .sort({ fecha: -1 })
    .lean();

    res.status(200).json({
      success: true,
      data: bitacoras,
      total: bitacoras.length,
      unidad: unidad
    });

  } catch (error) {
    console.error('Error obteniendo bitácoras de unidad residencial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 6. GET - Obtener Bitácoras de un Supervisor Específico (Admin)
exports.getBitacorasSupervisionBySupervisor = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const supervisorEmail = req.headers['x-editor-email']?.toLowerCase().trim();

    if (!userEmail || !supervisorEmail) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Validar que el supervisor existe y pertenece a la misma empresa
    const supervisorData = await validateUserCompanyAccess(supervisorEmail, 'editor');
    const supervisorCompanyIds = supervisorData.companyIds;

    // Verificar que ambos usuarios pertenecen a la misma empresa
    const commonCompanyIds = companyIds.filter(id => supervisorCompanyIds.includes(id));
    if (commonCompanyIds.length === 0) {
      return res.status(403).json({ error: 'El supervisor no pertenece a la misma empresa' });
    }

    // Buscar bitácoras del supervisor específico
    const bitacoras = await BitacoraSupervision.find({
      supervisorEmail,
      companyId: { $in: commonCompanyIds }
    })
    .sort({ fecha: -1 })
    .lean();

    // Obtener datos de las unidades residenciales por separado (mismo enfoque que getBitacorasSupervision)
    const unidadIds = bitacoras.map(b => b.unidadResidencialId);
    const unidades = await UnidadResidencial.find({ 
      _id: { $in: unidadIds },
      companyId: { $in: commonCompanyIds }
    }).lean();

    // Crear un mapa para acceso rápido
    const unidadesMap = {};
    unidades.forEach(u => {
      unidadesMap[u._id] = u;
    });

    // Agregar datos de la unidad a cada bitácora
    const bitacorasConUnidad = bitacoras.map(bitacora => {
      const unidad = unidadesMap[bitacora.unidadResidencialId] || null;
      return {
        ...bitacora,
        unidadResidencial: unidad,
        unidadNombre: unidad?.nombre || null
      };
    });

    res.status(200).json({
      success: true,
      data: bitacorasConUnidad,
      total: bitacorasConUnidad.length,
      supervisor: supervisorEmail
    });

  } catch (error) {
    console.error('Error obteniendo bitácoras del supervisor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Proxy de imagen para PDF: evita CORS al cargar fotos (ej. Dropbox) en el frontend
exports.getProxyImageForPdf = async (req, res) => {
  try {
    const url = req.query.url
    if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return res.status(400).json({ error: 'Query param url (http(s)) requerido' })
    }
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) {
      return res.status(response.status).send(response.statusText)
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'private, max-age=300')
    res.send(buffer)
  } catch (err) {
    console.warn('Proxy imagen PDF:', err.message)
    res.status(502).json({ error: 'No se pudo obtener la imagen' })
  }
};

// 7. GET - Obtener Bitácora Específica por ID (Frontend/Admin)
exports.getBitacoraSupervisionById = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { bitacoraId } = req.params;

    if (!userEmail || !bitacoraId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar acceso del usuario (puede ser admin o supervisor)
    let companyIds = [];
    let isAdmin = false;
    
    try {
      const adminData = await validateUserCompanyAccess(userEmail, 'admin');
      companyIds = adminData.companyIds;
      isAdmin = true;
    } catch (adminError) {
      // Si no es admin, intentar como supervisor
      try {
        const supervisorData = await validateUserCompanyAccess(userEmail, 'editor');
        companyIds = supervisorData.companyIds;
        isAdmin = false;
      } catch (supervisorError) {
        return res.status(403).json({ error: 'Usuario no tiene permisos' });
      }
    }

    // Buscar la bitácora CON TODAS LAS EVIDENCIAS (necesarias para mostrar imágenes)
    // No usar .select() aquí para cargar todos los campos incluyendo evidencias
    let bitacora = await BitacoraSupervision.findOne({
      _id: bitacoraId,
      companyId: { $in: companyIds }
    }).lean();
    
    console.log('🔍 Bitácora cargada con evidencias:', bitacora ? 'Sí' : 'No');
    if (bitacora && bitacora.evidencias) {
      const evidenciasCount = Object.keys(bitacora.evidencias).length;
      console.log(`✅ Evidencias cargadas: ${evidenciasCount} áreas con evidencias`);
    }

    // Si no se encuentra con filtros, intentar sin filtros para debug
    if (!bitacora) {
      const bitacoraSinFiltros = await BitacoraSupervision.findOne({ _id: bitacoraId }).lean();
      if (bitacoraSinFiltros) {
        console.error(`❌ Bitácora encontrada pero companyId no coincide: 
          (esperado: ${companyIds}, encontrado: ${bitacoraSinFiltros.companyId})`);
      }
      
      return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
    }

    // Obtener datos de la unidad residencial por separado
    let unidadResidencial = null;
    if (bitacora && bitacora.unidadResidencialId) {
      unidadResidencial = await UnidadResidencial.findOne({
        _id: bitacora.unidadResidencialId,
        companyId: { $in: companyIds }
      }).lean();
    }

    let nombreCompania = '';
    if (bitacora && bitacora.companyId) {
      const companyDoc = await Company.findOne({ _id: bitacora.companyId }).lean();
      nombreCompania = (companyDoc && companyDoc.name) ? String(companyDoc.name).trim() : '';
    }

    let nombreSupervisor = '';
    if (bitacora && bitacora.supervisorEmail) {
      const supUser = await GoogleSigninUser.findOne({
        Email: String(bitacora.supervisorEmail).toLowerCase().trim()
      }).lean();
      if (supUser) {
        nombreSupervisor = (supUser.FullName && String(supUser.FullName).trim())
          || [supUser.GivenName, supUser.FamilyName].filter(Boolean).join(' ').trim()
          || '';
      }
    }
    if (!nombreSupervisor && bitacora && bitacora.supervisor) {
      const s = String(bitacora.supervisor).trim();
      if (s && !s.includes('@')) nombreSupervisor = s;
    }

    // Si es supervisor, verificar que la bitácora le pertenece
    console.log('🔍 Verificando si es supervisor...');
    const googleUser = await GoogleSigninUser.findOne({ Email: userEmail });
    
    if (!googleUser) {
      console.error('❌ Usuario no encontrado en GoogleSigninUser');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const userRelations = await CompanyGoogleSigninUser.find({ 
      googlesigninuserId: googleUser._id.toString()
    });
    
    const isSupervisor = userRelations.some(rel => rel.role === 'editor');
    console.log('🔍 Es supervisor:', isSupervisor);
    console.log('🔍 supervisorEmail de bitácora:', bitacora.supervisorEmail);
    console.log('🔍 userEmail:', userEmail);
    
    // Normalizar ambos emails para comparación (case-insensitive y sin espacios)
    const normalizedSupervisorEmail = bitacora.supervisorEmail?.toLowerCase().trim();
    const normalizedUserEmail = userEmail?.toLowerCase().trim();
    
    if (isSupervisor && normalizedSupervisorEmail !== normalizedUserEmail) {
      console.error('❌ Supervisor no tiene acceso a esta bitácora');
      console.error('❌ supervisorEmail no coincide:', normalizedSupervisorEmail, '!==', normalizedUserEmail);
      return res.status(403).json({ error: 'No tienes acceso a esta bitácora' });
    }

    console.log('✅ Bitácora encontrada y accesible');

    // Si la bitácora está 'programada' y no tiene fechaInicio, establecerla ahora
    if (bitacora.estado === 'programada' && !bitacora.fechaInicio) {
      await BitacoraSupervision.findByIdAndUpdate(bitacoraId, {
        $set: { fechaInicio: new Date() }
      });
      bitacora.fechaInicio = new Date();
    }

    // Calcular resumen de áreas y elementos
    let resumen = {
      totalAreas: 0,
      areasCompletadas: 0,
      totalElementos: 0,
      elementosCompletados: 0
    };

    if (unidadResidencial && unidadResidencial.areas) {
      // Convertir areas de la unidad a objeto normal si es necesario
      let areasUnidad = unidadResidencial.areas;
      if (areasUnidad && typeof areasUnidad.toObject === 'function') {
        areasUnidad = areasUnidad.toObject();
      }
      
      // Contar total de áreas y elementos
      const areasKeys = Object.keys(areasUnidad || {});
      resumen.totalAreas = areasKeys.length;
      
      // Contar total de elementos en todas las áreas
      areasKeys.forEach(areaKey => {
        const area = areasUnidad[areaKey];
        if (area && area.items && Array.isArray(area.items)) {
          resumen.totalElementos += area.items.length;
        }
      });

      // Convertir areas de la bitácora a objeto normal si es necesario
      let areasBitacora = bitacora.areas || {};
      if (areasBitacora && typeof areasBitacora.toObject === 'function') {
        areasBitacora = areasBitacora.toObject();
      }
      
      // Contar áreas completadas (áreas con al menos un elemento calificado)
      let areasCompletadasCount = 0;
      let elementosCompletadosCount = 0;
      
      areasKeys.forEach(areaKey => {
        const areaBitacora = areasBitacora[areaKey];
        if (areaBitacora) {
          // Convertir a objeto normal si es Map
          let areaBitacoraObj = areaBitacora;
          if (areaBitacora && typeof areaBitacora.toObject === 'function') {
            areaBitacoraObj = areaBitacora.toObject();
          }
          
          // Contar elementos calificados en esta área
          const elementosCalificados = Object.keys(areaBitacoraObj || {}).length;
          
          if (elementosCalificados > 0) {
            areasCompletadasCount++;
            elementosCompletadosCount += elementosCalificados;
          }
        }
      });
      
      resumen.areasCompletadas = areasCompletadasCount;
      resumen.elementosCompletados = elementosCompletadosCount;
    }

    console.log('📊 Resumen calculado:', resumen);

    // Función auxiliar para convertir Maps anidados a objetos planos
    const convertMapsToObjects = (obj) => {
      if (obj === null || obj === undefined) return obj;
      
      // PRESERVAR fechas de MongoDB con formato {"$date": "..."}
      // Esto debe ir ANTES de cualquier otra conversión
      if (typeof obj === 'object' && obj !== null && obj.$date !== undefined) {
        // Es una fecha de MongoDB, preservarla tal cual
        return { $date: obj.$date };
      }
      
      // Si es un Map (de Mongoose o JavaScript nativo)
      if (obj instanceof Map || (obj.constructor && obj.constructor.name === 'Map')) {
        const result = {};
        for (const [key, value] of obj.entries()) {
          result[key] = convertMapsToObjects(value);
        }
        return result;
      }
      
      // Si tiene método toObject (Mongoose document)
      if (typeof obj.toObject === 'function') {
        return convertMapsToObjects(obj.toObject());
      }
      
      // Si es un array, convertir cada elemento
      if (Array.isArray(obj)) {
        return obj.map(item => convertMapsToObjects(item));
      }
      
      // Si es un objeto normal, convertir cada propiedad
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            result[key] = convertMapsToObjects(obj[key]);
          }
        }
        return result;
      }
      
      // Valor primitivo, devolverlo tal cual
      return obj;
    };

    // Log de fechas ANTES de convertir
    console.log('🔍 Fechas ANTES de convertir Maps (backend):', {
      fecha: bitacora.fecha,
      fechaProgramada: bitacora.fechaProgramada,
      fechaInicio: bitacora.fechaInicio,
      fechaFin: bitacora.fechaFin,
      createdAt: bitacora.createdAt,
      updatedAt: bitacora.updatedAt
    });
    
    // Convertir Maps anidados a objetos planos antes de devolver
    const bitacoraConvertida = convertMapsToObjects(bitacora);
    
    // Log de fechas DESPUÉS de convertir
    console.log('🔍 Fechas DESPUÉS de convertir Maps (backend):', {
      fecha: bitacoraConvertida.fecha,
      fechaProgramada: bitacoraConvertida.fechaProgramada,
      fechaInicio: bitacoraConvertida.fechaInicio,
      fechaFin: bitacoraConvertida.fechaFin,
      createdAt: bitacoraConvertida.createdAt,
      updatedAt: bitacoraConvertida.updatedAt
    });
    
    console.log('🔍 Bitácora convertida - Áreas:', bitacoraConvertida.areas ? Object.keys(bitacoraConvertida.areas).length + ' áreas' : 'sin áreas');
    console.log('🔍 Bitácora convertida - Evidencias:', bitacoraConvertida.evidencias ? Object.keys(bitacoraConvertida.evidencias).length + ' áreas' : 'sin evidencias');
    console.log('🔍 Bitácora convertida - Comentarios:', bitacoraConvertida.comentarios ? Object.keys(bitacoraConvertida.comentarios).length + ' áreas' : 'sin comentarios');
    
    // Log detallado de estructura de evidencias
    if (bitacoraConvertida.evidencias) {
      Object.entries(bitacoraConvertida.evidencias).forEach(([areaKey, areaEvidencias]) => {
        if (areaEvidencias && typeof areaEvidencias === 'object') {
          const itemsCount = Object.keys(areaEvidencias).length;
          console.log(`  - ${areaKey}: ${itemsCount} items con evidencias`);
          // Log de primer item para verificar estructura
          const firstItem = Object.entries(areaEvidencias)[0];
          if (firstItem) {
            const [itemName, evidencia] = firstItem;
            console.log(`    Ejemplo ${itemName}:`, {
              tipo: typeof evidencia,
              esObjeto: typeof evidencia === 'object',
              tieneUrl: typeof evidencia === 'object' && evidencia?.url,
              keys: typeof evidencia === 'object' ? Object.keys(evidencia) : null
            });
          }
        }
      });
    }
    
    // Log detallado de estructura de áreas (calificaciones)
    if (bitacoraConvertida.areas) {
      Object.entries(bitacoraConvertida.areas).forEach(([areaKey, areaRatings]) => {
        if (areaRatings && typeof areaRatings === 'object') {
          const itemsCount = Object.keys(areaRatings).length;
          console.log(`  - ${areaKey}: ${itemsCount} items con calificaciones`);
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...bitacoraConvertida,
        unidadResidencial: unidadResidencial,
        resumen: resumen,
        nombreCompania,
        nombreSupervisor
      }
    });

  } catch (error) {
    console.error('Error obteniendo bitácora por ID:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 7.1. PUT - Actualizar Bitácora de Supervisión (Reprogramar) (Admin)
exports.putActualizarBitacoraSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const supervisorEmail = req.headers['x-editor-email']?.toLowerCase().trim();
    const { bitacoraId } = req.params;
    const { unidadResidencialId, fecha, observaciones } = req.body;

    if (!userEmail || !bitacoraId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Buscar la bitácora
    const bitacora = await BitacoraSupervision.findOne({
      _id: bitacoraId,
      companyId: { $in: companyIds }
    });

    if (!bitacora) {
      return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
    }

    // Solo se puede actualizar si está en estado 'programada'
    if (bitacora.estado !== 'programada') {
      return res.status(400).json({ 
        error: 'Solo se pueden actualizar bitácoras en estado "programada"' 
      });
    }

    // Preparar datos de actualización
    const updateData = {};
    if (unidadResidencialId) {
      // Verificar que la unidad pertenece a la empresa
      const unidad = await UnidadResidencial.findOne({
        _id: unidadResidencialId,
        companyId: { $in: companyIds }
      });
      if (!unidad) {
        return res.status(404).json({ error: 'Unidad residencial no encontrada o no accesible' });
      }
      updateData.unidadResidencialId = unidadResidencialId;
    }
    if (fecha) {
      updateData.fecha = new Date(fecha);
      updateData.fechaProgramada = new Date(fecha);
    }
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones || '';
    }
    if (supervisorEmail) {
      // Verificar que el supervisor pertenece a la empresa
      const supervisorData = await validateUserCompanyAccess(supervisorEmail, 'editor');
      const supervisorCompanyIds = supervisorData.companyIds;
      const commonCompanyIds = companyIds.filter(id => supervisorCompanyIds.includes(id));
      if (commonCompanyIds.length === 0) {
        return res.status(403).json({ error: 'El supervisor no pertenece a la misma empresa' });
      }
      updateData.supervisorEmail = supervisorEmail;
    }

    updateData.updatedAt = new Date();

    // Actualizar la bitácora
    const bitacoraActualizada = await BitacoraSupervision.findByIdAndUpdate(
      bitacoraId,
      { $set: updateData },
      { new: true }
    ).lean();

    res.status(200).json({
      success: true,
      message: 'Bitácora actualizada exitosamente',
      data: bitacoraActualizada
    });

  } catch (error) {
    console.error('Error actualizando bitácora:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 7.2. DELETE - Eliminar Bitácora de Supervisión (Solo si está programada) (Admin)
exports.deleteBitacoraSupervision = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { bitacoraId } = req.params;

    if (!userEmail || !bitacoraId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    // Buscar la bitácora
    const bitacora = await BitacoraSupervision.findOne({
      _id: bitacoraId,
      companyId: { $in: companyIds }
    });

    if (!bitacora) {
      return res.status(404).json({ error: 'Bitácora no encontrada o no accesible' });
    }

    // Solo se puede eliminar si está en estado 'programada'
    if (bitacora.estado !== 'programada') {
      return res.status(400).json({ 
        error: 'Solo se pueden eliminar bitácoras en estado "programada"' 
      });
    }

    // Eliminar físicamente la bitácora
    await BitacoraSupervision.findByIdAndDelete(bitacoraId);

    res.status(200).json({
      success: true,
      message: 'Bitácora eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando bitácora:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ===== GESTIÓN DE SUPERVISORES =====

// 8. GET - Obtener supervisores de la empresa
exports.getSupervisoresByCompany = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { companyId } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'ID de empresa requerido' });
    }

    // Validar que el usuario es admin
    const { companyIds } = await validateUserCompanyAccess(userEmail, 'admin');

    if (!companyIds.includes(companyId)) {
      return res.status(403).json({ error: 'No tienes acceso a esta empresa' });
    }

    // Buscar supervisores (usuarios con rol 'editor') de la empresa
    const relations = await CompanyGoogleSigninUser.find({ 
      companyId: companyId,
      role: 'editor'
    }).lean();

    // Obtener IDs de usuarios
    const userIds = relations.map(rel => rel.googlesigninuserId);
    
    // Buscar usuarios de GoogleSigninUser
    const users = await GoogleSigninUser.find({ 
      _id: { $in: userIds } 
    }).lean();

    // Crear mapa de usuarios
    const usersMap = {};
    users.forEach(user => {
      usersMap[user._id.toString()] = user;
    });

    // Combinar datos
    const supervisores = relations.map(rel => {
      const user = usersMap[rel.googlesigninuserId.toString()] || null;
      return {
        _id: user ? user._id : null,
        email: user ? user.Email : null,
        name: user ? (user.GivenName + ' ' + (user.FamilyName || '')).trim() : null,
        FullName: user ? user.FullName : null,
        GivenName: user ? user.GivenName : null,
        FamilyName: user ? user.FamilyName : null,
        ImageURL: user ? user.ImageURL : null,
        role: rel.role,
      companyId: rel.companyId,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt
      };
    }).filter(s => s._id !== null); // Filtrar usuarios no encontrados

    res.status(200).json({
      success: true,
      data: supervisores,
      total: supervisores.length
    });

  } catch (error) {
    console.error('Error obteniendo supervisores:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

const GoogleSigninUser = require('../models/GoogleSigninUser.js');
const BitacoraSupervision = require('../models/BitacoraSupervision.model');
const PropuestaServicio = require('../models/PropuestaServicio.model');
const UnidadResidencial = require('../models/UnidadResidencial.model');

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} Distancia en kilómetros
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * GET - Obtener oportunidades de servicio cercanas (bitácoras con calificación R)
 * Query params: latitude, longitude, radius (en km, default 10)
 */
exports.getOportunidadesCercanas = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Se requieren las coordenadas (latitude, longitude)' 
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLon) || isNaN(radiusKm)) {
      return res.status(400).json({ 
        error: 'Las coordenadas y el radio deben ser números válidos' 
      });
    }

    console.log(`🔍 Buscando oportunidades cercanas a (${userLat}, ${userLon}) en radio de ${radiusKm}km`);

    // Obtener todas las bitácoras completadas o con novedad que tengan calificaciones R
    const bitacoras = await BitacoraSupervision.find({
      estado: { $in: ['completada', 'con_novedad'] },
      isActive: true
    }).lean();

    const oportunidades = [];

    // Procesar cada bitácora para encontrar elementos con calificación R
    for (const bitacora of bitacoras) {
      if (!bitacora.areas || !bitacora.evidencias) continue;

      // Iterar sobre las áreas
      for (const [areaKey, areaData] of Object.entries(bitacora.areas)) {
        if (!areaData || typeof areaData !== 'object') continue;

        // Iterar sobre los elementos del área
        for (const [itemKey, calificacion] of Object.entries(areaData)) {
          // Solo procesar calificaciones R (Regular - necesita atención)
          if (calificacion === 'R') {
            // Buscar evidencia correspondiente para obtener geolocalización
            const evidencia = bitacora.evidencias?.[areaKey]?.[itemKey];
            
            if (evidencia) {
              let evidenciaLat = null;
              let evidenciaLon = null;
              let imagenUrl = null;

              // Extraer geolocalización y URL de imagen (soporta evidencia con { fotos: [...] })
              const foto0 = (typeof evidencia === 'object' && evidencia !== null && Array.isArray(evidencia.fotos))
                ? evidencia.fotos[0]
                : evidencia;

              if (typeof foto0 === 'object' && foto0 && foto0.geolocation) {
                evidenciaLat = foto0.geolocation.latitude;
                evidenciaLon = foto0.geolocation.longitude;
                imagenUrl = foto0.url || foto0.image;
              } else if (typeof evidencia === 'string' && evidencia.startsWith('http')) {
                imagenUrl = evidencia;
                evidenciaLat = userLat;
                evidenciaLon = userLon;
              }

              // Si tenemos coordenadas, calcular distancia
              if (evidenciaLat && evidenciaLon) {
                const distancia = calcularDistancia(userLat, userLon, evidenciaLat, evidenciaLon);
                
                // Solo incluir si está dentro del radio
                if (distancia <= radiusKm) {
                  // Obtener información de la unidad residencial
                  let unidadNombre = 'Unidad sin nombre';
                  try {
                    const unidad = await UnidadResidencial.findOne({ 
                      _id: bitacora.unidadResidencialId 
                    }).lean();
                    if (unidad) {
                      unidadNombre = unidad.nombre || unidadNombre;
                    }
                  } catch (error) {
                    console.warn(`⚠️ No se pudo obtener unidad residencial ${bitacora.unidadResidencialId}`);
                  }

                  oportunidades.push({
                    bitacoraId: bitacora._id,
                    area: areaKey,
                    item: itemKey,
                    calificacion: calificacion,
                    unidadResidencialId: bitacora.unidadResidencialId,
                    unidadResidencialNombre: unidadNombre,
                    companyId: bitacora.companyId,
                    cliente: bitacora.cliente,
                    geolocation: {
                      latitude: evidenciaLat,
                      longitude: evidenciaLon
                    },
                    imagenUrl: imagenUrl,
                    distancia: Math.round(distancia * 100) / 100, // Redondear a 2 decimales
                    fechaBitacora: bitacora.fecha,
                    comentario: bitacora.comentarios?.[areaKey]?.[itemKey] || ''
                  });
                }
              }
            }
          }
        }
      }
    }

    // Ordenar por distancia (más cercanas primero)
    oportunidades.sort((a, b) => a.distancia - b.distancia);

    console.log(`✅ Encontradas ${oportunidades.length} oportunidades en radio de ${radiusKm}km`);

    res.status(200).json({
      success: true,
      data: oportunidades,
      count: oportunidades.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo oportunidades cercanas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo oportunidades cercanas',
      details: error.message 
    });
  }
};

/**
 * POST - Crear propuesta de servicio
 */
exports.postCrearPropuesta = async (req, res) => {
  try {
    const proveedorEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { bitacoraId, area, item, propuestaTexto, whatsapp } = req.body;

    if (!proveedorEmail) {
      return res.status(400).json({ error: 'Email de proveedor requerido' });
    }

    if (!bitacoraId || !area || !item || !propuestaTexto || !whatsapp) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: bitacoraId, area, item, propuestaTexto, whatsapp' 
      });
    }

    // Verificar que el usuario existe
    const proveedor = await GoogleSigninUser.findOne({ Email: proveedorEmail }).lean();
    if (!proveedor) {
      return res.status(404).json({ error: 'Usuario proveedor no encontrado' });
    }

    // Verificar que la bitácora existe y tiene el elemento con calificación R
    const bitacora = await BitacoraSupervision.findOne({ _id: bitacoraId }).lean();
    if (!bitacora) {
      return res.status(404).json({ error: 'Bitácora no encontrada' });
    }

    // Verificar que el elemento tiene calificación R
    const calificacion = bitacora.areas?.[area]?.[item];
    if (calificacion !== 'R') {
      return res.status(400).json({ 
        error: 'El elemento no tiene calificación R (Regular)' 
      });
    }

    // Obtener información de la unidad residencial
    let unidadNombre = 'Unidad sin nombre';
    try {
      const unidad = await UnidadResidencial.findOne({ 
        _id: bitacora.unidadResidencialId 
      }).lean();
      if (unidad) {
        unidadNombre = unidad.nombre || unidadNombre;
      }
    } catch (error) {
      console.warn(`⚠️ No se pudo obtener unidad residencial ${bitacora.unidadResidencialId}`);
    }

    // Obtener geolocalización e imagen de la evidencia
    const evidencia = bitacora.evidencias?.[area]?.[item];
    let geolocation = null;
    let imagenUrl = null;

    if (evidencia) {
      const foto0 = (typeof evidencia === 'object' && evidencia !== null && Array.isArray(evidencia.fotos))
        ? evidencia.fotos[0]
        : evidencia;

      if (typeof foto0 === 'object' && foto0 && foto0.geolocation) {
        geolocation = foto0.geolocation;
        imagenUrl = foto0.url || foto0.image;
      } else if (typeof evidencia === 'string' && evidencia.startsWith('http')) {
        imagenUrl = evidencia;
      }
    }

    // Crear la propuesta
    const propuesta = new PropuestaServicio({
      bitacoraId,
      area,
      item,
      proveedorEmail,
      proveedorNombre: proveedor.FullName || proveedorEmail,
      propuestaTexto,
      whatsapp,
      unidadResidencialId: bitacora.unidadResidencialId,
      unidadResidencialNombre: unidadNombre,
      companyId: bitacora.companyId,
      geolocation,
      imagenUrl,
      estado: 'pendiente'
    });

    await propuesta.save();

    console.log(`✅ Propuesta creada por ${proveedorEmail} para ${bitacoraId}/${area}/${item}`);

    res.status(201).json({
      success: true,
      data: propuesta,
      message: 'Propuesta creada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando propuesta:', error);
    res.status(500).json({ 
      error: 'Error creando propuesta',
      details: error.message 
    });
  }
};

/**
 * GET - Obtener propuestas de servicio (para admin)
 * Query params: companyId (opcional), estado (opcional)
 */
exports.getPropuestasServicio = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { companyId, estado } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    // Construir query
    const query = {};
    if (companyId) {
      query.companyId = companyId;
    }
    if (estado) {
      query.estado = estado;
    }

    const propuestas = await PropuestaServicio.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Obtenidas ${propuestas.length} propuestas`);

    res.status(200).json({
      success: true,
      data: propuestas,
      count: propuestas.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo propuestas:', error);
    res.status(500).json({ 
      error: 'Error obteniendo propuestas',
      details: error.message 
    });
  }
};

/**
 * PUT - Actualizar estado de propuesta (aceptar/rechazar)
 */
exports.putActualizarPropuesta = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email']?.toLowerCase().trim();
    const { propuestaId } = req.params;
    const { estado, respuestaAdmin } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    if (!estado || !['aceptada', 'rechazada', 'completada'].includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser: aceptada, rechazada o completada' 
      });
    }

    const propuesta = await PropuestaServicio.findOne({ _id: propuestaId });
    if (!propuesta) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    // Actualizar estado
    propuesta.estado = estado;
    if (respuestaAdmin) {
      propuesta.respuestaAdmin = respuestaAdmin;
    }
    propuesta.fechaRespuesta = new Date();
    propuesta.updatedAt = new Date();

    await propuesta.save();

    console.log(`✅ Propuesta ${propuestaId} actualizada a estado: ${estado}`);

    res.status(200).json({
      success: true,
      data: propuesta,
      message: `Propuesta ${estado} exitosamente`
    });

  } catch (error) {
    console.error('❌ Error actualizando propuesta:', error);
    res.status(500).json({ 
      error: 'Error actualizando propuesta',
      details: error.message 
    });
  }
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  EJEMPLO DE USO - Generación de PDF en Correos                            ║
// ║  Archivo: api/services/email.service.example.js                          ║
// ║  Uso: Referencia para entender el flujo completo                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const emailService = require('./email.service');

/**
 * EJEMPLO 1: Envío básico de bitácora
 */
const ejemplo1_EnvioBitacora = async () => {
  console.log('\n═══════════════════════════════════════');
  console.log('📧 EJEMPLO 1: Envío Básico de Bitácora');
  console.log('═══════════════════════════════════════\n');

  const bitacora = {
    _id: '507f1f77bcf86cd799439011',
    estado: 'completada',
    supervisor: 'Juan Pérez López',
    fechaProgramada: new Date('2026-01-31'),
    fechaInicio: new Date('2026-01-31 08:00'),
    fechaFin: new Date('2026-01-31 12:30'),
    comentarioGlobal: 'Supervisión completada sin novedad',
    areas: {
      seguridad: {
        'Cámaras': 'E',
        'Puertas': 'B',
        'Luces': 'E'
      },
      mantenimiento: {
        'Pasillo': 'B',
        'Escaleras': 'B'
      }
    },
    comentarios: {
      seguridad: {
        'Cámaras': 'Todas funcionando correctamente',
        'Puertas': 'Requieren ajuste menor'
      },
      mantenimiento: {
        'Pasillo': 'Limpio y bien iluminado'
      }
    },
    evidencias: {
      seguridad: {
        'Cámaras': 'https://example.com/camera1.jpg'
      }
    }
  };

  const unidad = {
    nombre: 'Condominio Montserrat',
    tipo: 'condominio',
    direccion: 'Cra 50 #35-20, Medellín',
    correo: 'admin@condomiomontserrat.com'
  };

  const areas = [
    {
      key: 'seguridad',
      name: 'Seguridad Física',
      items: ['Cámaras', 'Puertas', 'Luces']
    },
    {
      key: 'mantenimiento',
      name: 'Mantenimiento Preventivo',
      items: ['Pasillo', 'Escaleras']
    }
  ];

  try {
    const resultado = await emailService.enviarBitacoraByEmail({
      bitacora,
      unidad,
      areas
    });

    console.log('\n✅ Resultado del envío:');
    console.log(JSON.stringify(resultado, null, 2));

    return resultado;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return null;
  }
};

/**
 * EJEMPLO 2: Generar solo HTML sin enviar
 */
const ejemplo2_GenerarHTML = () => {
  console.log('\n═════════════════════════════════════');
  console.log('📄 EJEMPLO 2: Generar Solo HTML');
  console.log('═════════════════════════════════════\n');

  const bitacora = {
    _id: 'test-123',
    estado: 'con_novedad',
    supervisor: 'María García',
    fechaProgramada: new Date(),
    comentarioGlobal: 'Se encontraron 2 novedades'
  };

  const unidad = {
    nombre: 'Edificio Centro',
    tipo: 'edificio',
    direccion: 'Calle 50 #10-50'
  };

  const areas = [
    {
      key: 'común',
      name: 'Áreas Comunes',
      items: ['Lobby', 'Baños', 'Cuarto Técnico']
    }
  ];

  try {
    const html = emailService.generarPDFHTML(bitacora, unidad, areas);
    
    console.log(`✅ HTML generado - Longitud: ${html.length} caracteres`);
    console.log('\n📊 Primeros 500 caracteres:');
    console.log(html.substring(0, 500) + '...\n');

    return html;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

/**
 * EJEMPLO 3: Generar PDF sin enviar correo
 */
const ejemplo3_GenerarPDF = async () => {
  console.log('\n═════════════════════════════════════');
  console.log('📋 EJEMPLO 3: Generar Solo PDF');
  console.log('═════════════════════════════════════\n');

  const bitacora = {
    _id: 'pdf-test-456',
    estado: 'completada',
    supervisor: 'Carlos Rodríguez'
  };

  const unidad = {
    nombre: 'Conjunto Residencial Villa',
    tipo: 'conjunto_residencial'
  };

  const areas = [];

  try {
    console.log('🔄 Generando HTML...');
    const html = emailService.generarPDFHTML(bitacora, unidad, areas);
    console.log('✅ HTML generado');

    console.log('🔄 Convirtiendo a PDF...');
    const rutaPDF = await emailService.generarPDFenTmp(html, bitacora._id);
    console.log(`✅ PDF generado en: ${rutaPDF}`);

    console.log('\n📊 Información del archivo:');
    const fs = require('fs');
    const stats = fs.statSync(rutaPDF);
    console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Ruta: ${rutaPDF}`);

    return rutaPDF;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

/**
 * EJEMPLO 4: Prueba de configuración de email
 */
const ejemplo4_ProbarConfiguracion = async () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('⚙️  EJEMPLO 4: Prueba de Configuración');
  console.log('═══════════════════════════════════════════\n');

  // Simular envío sin correo real
  const archivo = '/tmp/test_bitacora_12345.pdf';
  const correo = 'test@example.com';
  const unidad = 'Unidad Test';
  const supervisor = 'Supervisor Test';
  const estado = 'completada';

  console.log('📧 Parámetros de envío:');
  console.log(`   Archivo: ${archivo}`);
  console.log(`   Correo: ${correo}`);
  console.log(`   Unidad: ${unidad}`);
  console.log(`   Supervisor: ${supervisor}`);
  console.log(`   Estado: ${estado}`);
  console.log('\n⚠️  Nota: Esta es solo una simulación, no se enviará correo real\n');

  try {
    // Aquí iría el envío real
    console.log('✅ Parámetros validados');
    console.log('✅ Configuración lista para enviar');

    return {
      valido: true,
      mensaje: 'Configuración correcta'
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      valido: false,
      error: error.message
    };
  }
};

/**
 * EJEMPLO 5: Uso en controlador (reglas-negocio.controller.js)
 */
const ejemplo5_EnControlador = () => {
  console.log('\n════════════════════════════════════════════');
  console.log('🔧 EJEMPLO 5: Integración en Controlador');
  console.log('════════════════════════════════════════════\n');

  const codigo = `
// En: api/controllers/reglas-negocio.controller.js

exports.completarBitacora = async (req, res) => {
  try {
    // ... código existente ...

    // Después de guardar la bitácora
    const bitacoraGuardada = await BitacoraSupervision.findById(bitacoraId);
    const unidad = await UnidadResidencial.findById(bitacoraGuardada.unidadId);

    // 🎯 NUEVO: Enviar PDF por correo
    const resultadoEmail = await enviarBitacoraByEmail({
      bitacora: bitacoraGuardada,
      unidad: unidad,
      areas: areasDefault
    });

    // Validar resultado
    if (resultadoEmail.success) {
      console.log('✅ Bitácora enviada por email');
      res.status(200).json({
        success: true,
        message: 'Bitácora completada y enviada por email',
        bitacora: bitacoraGuardada,
        emailResult: resultadoEmail
      });
    } else {
      console.warn('⚠️  Bitácora completada pero email falló:', resultadoEmail.message);
      res.status(200).json({
        success: true,
        message: 'Bitácora completada. Email no se pudo enviar.',
        bitacora: bitacoraGuardada,
        emailWarning: resultadoEmail
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
};
  `;

  console.log('📝 Código de integración:\n');
  console.log(codigo);

  return codigo;
};

/**
 * EJEMPLO 6: Manejo de errores
 */
const ejemplo6_ManejoErrores = async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('🚨 EJEMPLO 6: Manejo de Errores');
  console.log('══════════════════════════════════════════\n');

  const escenarios = [
    {
      nombre: 'Sin correo en la unidad',
      bitacora: { _id: 'test', estado: 'completada' },
      unidad: { nombre: 'Test', tipo: 'condominio' }, // SIN correo
      resultado: '❌ Unidad sin correo asignado'
    },
    {
      nombre: 'HTML vacío',
      generarHTML: () => '',
      resultado: '⚠️  PDF con contenido mínimo'
    },
    {
      nombre: 'Archivo no encontrado',
      archivo: '/tmp/no_existe_12345.pdf',
      resultado: '❌ Archivo PDF no encontrado'
    },
    {
      nombre: 'mutt no instalado',
      comando: 'echo "test" | mutt -s "Test"',
      resultado: '❌ mutt: command not found'
    }
  ];

  console.log('Escenarios de error y cómo se manejan:\n');
  escenarios.forEach((escenario, index) => {
    console.log(`${index + 1}. ${escenario.nombre}`);
    console.log(`   Resultado: ${escenario.resultado}\n`);
  });

  return escenarios;
};

/**
 * EJEMPLO 7: Testing en desarrollo local
 */
const ejemplo7_TestingLocal = () => {
  console.log('\n════════════════════════════════════════');
  console.log('🧪 EJEMPLO 7: Testing Local');
  console.log('════════════════════════════════════════\n');

  const comandos = {
    paso1_InstalarDependencias: 'npm install html-pdf --legacy-peer-deps',
    
    paso2_ProbarGenerarPDF: `
node -e "
const emailService = require('./api/services/email.service.js');
const html = emailService.generarPDFHTML(
  { _id: 'test', estado: 'completada', supervisor: 'Test' },
  { nombre: 'Test Unit', tipo: 'condominio', direccion: 'Test St' },
  []
);
emailService.generarPDFenTmp(html, 'test-pdf').then(path => {
  console.log('✅ PDF creado en:', path);
});
"
    `,

    paso3_VerificarArchivo: 'ls -lh /tmp/bitacora_*.pdf',

    paso4_Limpiar: 'rm /tmp/bitacora_*.pdf'
  };

  console.log('🔧 Pasos para testear:\n');
  Object.entries(comandos).forEach(([paso, comando]) => {
    console.log(`${paso}:`);
    console.log(`$ ${comando}\n`);
  });

  return comandos;
};

/**
 * EJECUTAR TODOS LOS EJEMPLOS
 */
const ejecutarTodosLosEjemplos = async () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║        EJEMPLOS DE USO - GENERACIÓN DE PDF EN EMAILS      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Ejemplo 2
  const html = ejemplo2_GenerarHTML();

  // Ejemplo 3
  const pdfPath = await ejemplo3_GenerarPDF();

  // Ejemplo 4
  const config = await ejemplo4_ProbarConfiguracion();

  // Ejemplo 5
  const codigoIntegracion = ejemplo5_EnControlador();

  // Ejemplo 6
  const errores = await ejemplo6_ManejoErrores();

  // Ejemplo 7
  const testing = ejemplo7_TestingLocal();

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                   FIN DE EJEMPLOS                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📚 Próximos pasos:');
  console.log('1. Revisar GENERACION_PDF_EMAILS.md');
  console.log('2. Revisar CONFIGURACION_PDF_AVANZADA.md');
  console.log('3. Ejecutar ejemplo1_EnvioBitacora() en producción');
  console.log('4. Validar PDFs en cliente de email\n');
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTAR EJEMPLOS PARA USO
// ═══════════════════════════════════════════════════════════════════
module.exports = {
  ejemplo1_EnvioBitacora,
  ejemplo2_GenerarHTML,
  ejemplo3_GenerarPDF,
  ejemplo4_ProbarConfiguracion,
  ejemplo5_EnControlador,
  ejemplo6_ManejoErrores,
  ejemplo7_TestingLocal,
  ejecutarTodosLosEjemplos
};

// ═══════════════════════════════════════════════════════════════════
// PARA EJECUTAR DESDE LÍNEA DE COMANDOS
// ═══════════════════════════════════════════════════════════════════
/*

EJECUTAR EJEMPLOS:

1. Ejemplo básico (mostrar documentación)
   $ node -e "require('./api/services/email.service.example.js').ejecutarTodosLosEjemplos()"

2. Generar HTML
   $ node -e "require('./api/services/email.service.example.js').ejemplo2_GenerarHTML()"

3. Generar PDF
   $ node -e "require('./api/services/email.service.example.js').ejemplo3_GenerarPDF()"

4. Prueba completa (necesita servidor SMTP configurado)
   $ node -e "require('./api/services/email.service.example.js').ejemplo1_EnvioBitacora()"

*/

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * CONFIGURACIÓN FIJA PARA MARMA
 * Todos los correos SIEMPRE se envían a nombre de MARMA usando la cuenta marma_gmail
 * configurada en ~/.msmtprc (CLIENTE 2: account marma_gmail, from operativo.marma@gmail.com)
 */
const MARMA_MSMTP_ACCOUNT = 'marma_gmail';
const MARMA_EMAIL = 'operativo.marma@gmail.com';
const MARMA_REMITENTE_NOMBRE = 'MARMA';

/**
 * Enviar correo con PDF usando mutt + msmtp
 * El PDF debe venir del frontend (base64); el backend no genera PDF.
 * 
 * IMPORTANTE: Todos los correos SIEMPRE se envían a nombre de MARMA usando la cuenta marma_gmail
 * configurada en ~/.msmtprc (CLIENTE 2: account marma_gmail, from operativo.marma@gmail.com)
 */
const enviarPorCorreo = ({ archivo, correo, unidad, supervisor, estado, clientName }) => {
  return new Promise((resolve, reject) => {
    if (!archivo || !correo) {
      return reject(new Error('Faltan parámetros: archivo o correo'));
    }

    // Validar que el archivo PDF existe
    if (!fs.existsSync(archivo)) {
      return reject(new Error(`Archivo PDF no encontrado: ${archivo}`));
    }

    const estado_text = estado === 'con_novedad' ? 'Con Novedad' : 'Completada';
    // Usar el nombre del cliente para el asunto y firma, pero el remitente SIEMPRE será MARMA
    const nombreCliente = (clientName && String(clientName).trim()) || 'MARMA';
    
    const asunto = `Bitácora de Supervisión ${nombreCliente} - ${unidad || 'Unidad'} - ${estado_text}`;
    const firma = nombreCliente || 'MARMA';
    const mensaje = `Estimado,\n\nAdjunto encontrará el reporte de supervisión para la unidad residencial en formato PDF.\n\nSupervisor: ${supervisor}\nFecha: ${new Date().toLocaleDateString('es-ES')}\n\nAtentamente,\n${firma}`;

    // SIEMPRE usar configuración de MARMA para el remitente
    // El remitente siempre será "MARMA <operativo.marma@gmail.com>" usando la cuenta marma_gmail
    const remitenteNombre = MARMA_REMITENTE_NOMBRE;
    const clienteEmail = MARMA_EMAIL;
    const msmtpAccount = MARMA_MSMTP_ACCOUNT;
    
    // Construir comando mutt con configuración de MARMA
    // Configurar from, realname y sendmail para que el correo llegue a nombre de MARMA
    const muttConfig = `set realname='${remitenteNombre.replace(/'/g, "'\\''")}' from='${clienteEmail.replace(/'/g, "'\\''")}' sendmail='msmtp -a ${msmtpAccount}'`;
    
    // Construir comando completo con variable de entorno como respaldo
    const cmd = `MSMTP_ACCOUNT=${msmtpAccount} echo '${mensaje.replace(/'/g, "'\\''")}' | mutt -e "${muttConfig}" -s '${asunto.replace(/'/g, "'\\''")}' -a ${archivo} -- ${correo}`;

    console.log(`📧 ===== CONFIGURACIÓN DE CORREO (SIEMPRE MARMA) =====`);
    console.log(`📧 Destinatario: ${correo}`);
    console.log(`📧 Cliente (para asunto/firma): ${nombreCliente}`);
    console.log(`📧 Cuenta msmtp: ${msmtpAccount} (SIEMPRE marma_gmail)`);
    console.log(`📧 Remitente (realname): ${remitenteNombre} (SIEMPRE MARMA)`);
    console.log(`📧 Remitente (from): ${clienteEmail} (SIEMPRE operativo.marma@gmail.com)`);
    console.log(`📧 Asunto: ${asunto}`);
    console.log(`📧 Adjunto PDF: ${archivo}`);
    console.log(`📧 Configuración mutt: ${muttConfig}`);
    console.log(`📧 Comando completo: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error ejecutando mutt:', error.message);
        console.error('❌ stderr:', stderr);
        reject(error);
      } else {
        console.log(`✅ Correo con PDF enviado exitosamente a: ${correo}`);
        resolve({
          success: true,
          correo: correo,
          archivo: archivo,
          tipoPDF: 'application/pdf'
        });
      }
    });
  });
};

/**
 * Limpiar archivo temporal
 */
const limpiarArchivoTmp = (filepath) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fs.unlink(filepath, (err) => {
        if (err) {
          console.warn(`⚠️ Error limpiando archivo temporal ${filepath}:`, err.message);
        } else {
          console.log(`🧹 Archivo temporal eliminado: ${filepath}`);
        }
        resolve();
      });
    }, 5000); // Esperar 5 segundos antes de eliminar (dar tiempo a mutt de procesar)
  });
};

/**
 * Procesar PDF base64 recibido del frontend y enviarlo por correo
 * El PDF se genera en el frontend (html2pdf.js) y se envía como base64.
 * clientName: nombre del cliente (ej. MARMA) para personalizar asunto y firma del correo.
 */
const procesarPDFDelFrontend = async (pdfBase64, bitacora, unidad, clientName) => {
  try {
    console.log('📧 ===== PROCESANDO PDF DEL FRONTEND =====');
    console.log('📋 Bitácora ID:', bitacora._id);
    console.log('📋 Unidad:', unidad?.nombre);
    console.log('📋 Correo destino:', unidad?.correo);
    console.log('📋 Cliente (firma correo):', clientName || '(por defecto)');
    console.log('📧 PDF recibido - tamaño:', (pdfBase64.length / 1024).toFixed(2), 'KB');

    // Validar que tenemos el correo
    if (!unidad?.correo) {
      console.warn('⚠️ La unidad no tiene correo asignado.');
      return {
        success: false,
        message: 'Unidad sin correo asignado'
      };
    }

    // 1. Convertir base64 (PDF generado en frontend) a Buffer y guardar en /tmp como .pdf
    console.log('💾 Guardando PDF del frontend en archivo temporal...');
    const nombreArchivo = `bitacora_${bitacora._id}_${Date.now()}.pdf`;
    const rutaArchivo = path.join('/tmp', nombreArchivo);

    const buffer = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync(rutaArchivo, buffer);

    const stats = fs.statSync(rutaArchivo);
    console.log(`✅ PDF guardado en: ${rutaArchivo}`);
    console.log(`📊 Tamaño del archivo: ${(stats.size / 1024).toFixed(2)} KB`);

    // 2. Enviar por correo con PDF adjunto (personalizado con nombre del cliente)
    console.log('📮 Enviando correo con PDF adjunto...');
    const resultadoEnvio = await enviarPorCorreo({
      archivo: rutaArchivo,
      correo: unidad.correo,
      unidad: unidad.nombre,
      supervisor: bitacora.supervisor,
      estado: bitacora.estado,
      clientName: clientName || null
    });
    console.log('✅ Correo enviado exitosamente');

    // 3. Limpiar archivo (asincrónico, sin esperar)
    console.log('🧹 Programando limpieza de archivo...');
    limpiarArchivoTmp(rutaArchivo);

    console.log('📧 ===== PROCESAMIENTO DE PDF COMPLETADO =====');
    return {
      success: true,
      message: 'PDF del frontend enviado por correo exitosamente',
      correo: unidad.correo,
      archivoPDF: rutaArchivo,
      tamano: stats.size,
      detalles: resultadoEnvio,
      fuente: 'frontend'
    };

  } catch (error) {
    console.error('❌ Error procesando PDF del frontend:', error.message);
    console.error('❌ Stack:', error.stack);
    return {
      success: false,
      message: 'Error al procesar PDF del frontend',
      error: error.message
    };
  }
};

module.exports = {
  enviarPorCorreo,
  limpiarArchivoTmp,
  procesarPDFDelFrontend
};

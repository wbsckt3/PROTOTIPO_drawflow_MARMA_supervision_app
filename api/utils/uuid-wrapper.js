/**
 * Wrapper CommonJS para uuid (ESM)
 * Soluciona: Error [ERR_REQUIRE_ESM]
 * 
 * Uso:
 * const { v4: uuidv4 } = require('./uuid-wrapper');
 * const id = uuidv4();
 */

let uuidModule = null;

// Importar dinámicamente uuid al iniciar
(async () => {
  try {
    uuidModule = await import('uuid');
    console.log('✅ UUID wrapper cargado exitosamente');
  } catch (error) {
    console.error('❌ Error cargando uuid:', error.message);
    process.exit(1);
  }
})();

// Exportar v4 igual como el módulo original
module.exports = {
  v4: (() => {
    // Retorna una función que llama a uuidModule.v4()
    return function() {
      if (!uuidModule) {
        throw new Error('UUID aún no está cargado');
      }
      return uuidModule.v4();
    };
  })()
};

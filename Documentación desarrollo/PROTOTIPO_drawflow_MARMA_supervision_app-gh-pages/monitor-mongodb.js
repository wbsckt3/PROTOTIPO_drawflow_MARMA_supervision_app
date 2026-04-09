// Script para monitorear el uso de MongoDB
const mongoose = require('mongoose');

async function checkMongoDBUsage() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://tu-connection-string');
    
    // Obtener estadísticas de la base de datos
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    console.log('📊 Estadísticas de MongoDB:');
    console.log('========================');
    console.log(`💾 Tamaño de la base de datos: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Tamaño total (con índices): ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📋 Número de colecciones: ${stats.collections}`);
    console.log(`📄 Número de documentos: ${stats.objects}`);
    console.log(`🔍 Número de índices: ${stats.indexes}`);
    
    // Verificar límites de la capa gratuita
    const storageLimitMB = 512;
    const currentStorageMB = stats.storageSize / 1024 / 1024;
    const usagePercentage = (currentStorageMB / storageLimitMB) * 100;
    
    console.log('\n🚨 Límites de la capa gratuita:');
    console.log('==============================');
    console.log(`📊 Uso de almacenamiento: ${usagePercentage.toFixed(1)}% (${currentStorageMB.toFixed(2)}MB / ${storageLimitMB}MB)`);
    
    if (usagePercentage > 80) {
      console.log('⚠️  ADVERTENCIA: Te estás acercando al límite de almacenamiento');
    } else if (usagePercentage > 90) {
      console.log('🚨 CRÍTICO: Muy cerca del límite de almacenamiento');
    } else {
      console.log('✅ Uso normal de almacenamiento');
    }
    
    // Listar colecciones y su tamaño
    console.log('\n📋 Colecciones y su tamaño:');
    console.log('===========================');
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collStats = await db.collection(collection.name).stats();
      const sizeMB = (collStats.size / 1024 / 1024).toFixed(2);
      const count = collStats.count;
      console.log(`  ${collection.name}: ${sizeMB}MB (${count} documentos)`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar MongoDB:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkMongoDBUsage();
}

module.exports = { checkMongoDBUsage };

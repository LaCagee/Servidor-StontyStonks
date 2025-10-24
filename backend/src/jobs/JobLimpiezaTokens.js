// ============================================
// JOB DE LIMPIEZA DE TOKENS EXPIRADOS
// ============================================
const cron = require('node-cron');
const Token = require('../models/Token'); 

function startTokenCleanupJob() {
  // Ejecutar cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    try {
      const deletedCount = await Token.cleanExpiredTokens();

      if (deletedCount > 0) {
        const timestamp = new Date().toISOString();
        console.log(`🗑️  [${timestamp}] Limpieza de tokens expirados: ${deletedCount} tokens eliminados`);
      }
    } catch (error) {
      console.error('❌ Error en limpieza de tokens expirados:', error);
    }
  });

  console.log('✅ Job de limpieza de tokens expirados iniciado (cada 15 minutos)');
}

module.exports = startTokenCleanupJob;

require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { User, Token, Transaction, Goal, Budget, Category } = require('./src/models'); // ← IMPORTAR MODELOS para Prueba de Sincronización

const PORT = process.env.PORT || 3000;

// Sincronizar base de datos y levantar servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');

    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      //await sequelize.sync({ alter: true }); // Alternativa: ajusta tablas sin perder datos
      await sequelize.sync({}); // Peligroso: elimina y recrea tablas (pérdida de datos)

      console.log('✅ Modelos sincronizados con la base de datos');
      // ========== PRUEBA DE MODELOS (TEMPORAL) ==========
      console.log('\n🧪 Probando modelos...\n');
      await Category.createSystemCategories();
      // Contar registros existentes
      const userCount = await User.count();
      const tokenCount = await Token.count();
      const transactionCount = await Transaction.count();
      const goalCount = await Goal.count();
      const budgetCount = await Budget.count();
      const categoryCount = await Category.count();

      console.log(`📊 Usuarios: ${userCount}`);
      console.log(`📊 Tokens: ${tokenCount}`);
      console.log(`📊 Transacciones: ${transactionCount}`);
      console.log(`📊 Metas: ${goalCount}`);
      console.log(`📊 Presupuestos: ${budgetCount}`);
      console.log(`📊 Categorias: ${categoryCount}`);

      console.log('\n✅ Todos los modelos funcionan correctamente\n');
      // ==================================================
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);

      // 🔹 Iniciar job de limpieza de tokens expirados
      const startTokenCleanupJob = require('./src/jobs/JobLimpiezaTokens');
      startTokenCleanupJob();
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
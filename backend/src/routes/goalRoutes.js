// ============================================
// RUTAS DE METAS FINANCIERAS (GOALS)
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const goalController = require('../controllers/goalController');
const {
  validateCreate,
  validateUpdate,
  validateFilters
} = require('../validators/goalValidator');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// Crear nueva meta
router.post(
  '/',
  authMiddleware,
  validateCreate,
  goalController.createGoal
);

// Obtener todas las metas del usuario
router.get(
  '/',
  authMiddleware,
  validateFilters,
  goalController.getAllGoals
);

// Verificar progreso de metas automáticamente
router.post(
  '/check-progress',
  authMiddleware,
  goalController.checkGoalsProgress
);

// Obtener meta específica por ID
router.get(
  '/:id',
  authMiddleware,
  goalController.getGoalById
);

// Actualizar meta
router.put(
  '/:id',
  authMiddleware,
  validateUpdate,
  goalController.updateGoal
);

// Eliminar meta
router.delete(
  '/:id',
  authMiddleware,
  goalController.deleteGoal
);

// ==================== ACCIONES ESPECÍFICAS ====================

// Pausar meta
router.post(
  '/:id/pause',
  authMiddleware,
  goalController.pauseGoal
);

// Reactivar meta
router.post(
  '/:id/activate',
  authMiddleware,
  goalController.activateGoal
);

// Cancelar meta
router.post(
  '/:id/cancel',
  authMiddleware,
  goalController.cancelGoal
);

// Marcar meta como completada manualmente
router.post(
  '/:id/complete',
  authMiddleware,
  goalController.completeGoal
);

// Obtener transacciones asociadas a una meta
router.get(
  '/:id/transactions',
  authMiddleware,
  goalController.getGoalTransactions
);

module.exports = router;
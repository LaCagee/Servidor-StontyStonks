// ============================================
// RUTAS DE PRESUPUESTOS
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const budgetController = require('../controllers/Budgetcontroller');
const {
  validateCreate,
  validateUpdate,
  validateFilters,
  validateSuggest,
  validateCreateMultiple
} = require('../validators/Budgetvalidator');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// ==================== CRUD BÁSICO ====================

// Crear presupuesto
router.post(
  '/',
  authMiddleware,
  validateCreate,
  budgetController.createBudget
);

// Crear múltiples presupuestos
router.post(
  '/multiple',
  authMiddleware,
  validateCreateMultiple,
  budgetController.createMultipleBudgets
);

// Obtener todos los presupuestos (con filtros opcionales)
router.get(
  '/',
  authMiddleware,
  validateFilters,
  budgetController.getAllBudgets
);

// Obtener presupuestos del mes actual
router.get(
  '/current-month',
  authMiddleware,
  budgetController.getCurrentMonthBudgets
);

// Obtener presupuesto específico por ID
router.get(
  '/:id',
  authMiddleware,
  budgetController.getBudgetById
);

// Actualizar presupuesto
router.put(
  '/:id',
  authMiddleware,
  validateUpdate,
  budgetController.updateBudget
);

// Eliminar presupuesto
router.delete(
  '/:id',
  authMiddleware,
  budgetController.deleteBudget
);

// ==================== ACTIVACIÓN/DESACTIVACIÓN ====================

// Desactivar presupuesto
router.post(
  '/:id/deactivate',
  authMiddleware,
  budgetController.deactivateBudget
);

// Activar presupuesto
router.post(
  '/:id/activate',
  authMiddleware,
  budgetController.activateBudget
);

// ==================== ALERTAS Y RESÚMENES ====================

// Obtener presupuestos que requieren alerta
router.get(
  '/alerts/pending',
  authMiddleware,
  budgetController.getBudgetsRequiringAlert
);

// Obtener presupuestos excedidos
router.get(
  '/alerts/exceeded',
  authMiddleware,
  budgetController.getExceededBudgets
);

// Obtener resumen general de presupuestos
router.get(
  '/summary/general',
  authMiddleware,
  budgetController.getBudgetSummary
);

// ==================== SUGERENCIAS Y AUTOMATIZACIÓN ====================

// Sugerir presupuesto automático basado en historial
router.get(
  '/suggest/auto',
  authMiddleware,
  validateSuggest,
  budgetController.suggestBudget
);

// Crear presupuestos para el próximo mes (basados en el mes actual)
router.post(
  '/auto/next-month',
  authMiddleware,
  budgetController.createNextMonthBudgets
);

module.exports = router;
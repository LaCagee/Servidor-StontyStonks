// ============================================
// RUTAS DE CATEGORÍAS
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

// ==================== RUTAS PÚBLICAS/PROTEGIDAS ====================
// Nota: Las categorías son del sistema, pero requieren autenticación para usarlas

// Obtener todas las categorías activas
router.get(
  '/',
  authMiddleware,
  categoryController.getAllCategories
);

// Obtener categorías de ingresos
router.get(
  '/income',
  authMiddleware,
  categoryController.getIncomeCategories
);

// Obtener categorías de gastos
router.get(
  '/expense',
  authMiddleware,
  categoryController.getExpenseCategories
);

// Obtener categoría específica por ID
router.get(
  '/:id',
  authMiddleware,
  categoryController.getCategoryById
);

module.exports = router;
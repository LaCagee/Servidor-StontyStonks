// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const transactionController = require('../controllers/transactionController');
const { validateCreate, validateUpdate, validateFilters } = require('../validators/transactionValidator');

// ============================
// CRUD y acciones de transacciones
// ============================

// Crear nueva transacción
router.post(
  '/', 
  authMiddleware, 
  validateCreate,  
  transactionController.createTransaction
);

// Listar todas las transacciones del usuario
router.get(
  '/', 
  authMiddleware, 
  validateFilters,  
  transactionController.getAllTransactions
);

// Obtener transacción específica
router.get(
  '/:id', 
  authMiddleware, 
  transactionController.getTransactionById
);

// Actualizar transacción
router.put(
  '/:id', 
  authMiddleware, 
  validateUpdate, 
  transactionController.updateTransaction
);

// Soft delete
router.delete(
  '/:id', 
  authMiddleware, 
  transactionController.softDeleteTransaction
);

// Restaurar transacción eliminada
router.post(
  '/:id/restore', 
  authMiddleware, 
  transactionController.restoreTransaction
);

// Eliminar permanentemente
router.delete(
  '/:id/permanent', 
  authMiddleware, 
  transactionController.deleteTransactionPermanently
);

module.exports = router;
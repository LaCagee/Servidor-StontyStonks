// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); // Protege rutas
const transactionController = require('../controllers/transactionController');

// ============================
// CRUD y acciones de transacciones
// ============================

// Crear nueva transacción
router.post('/', authMiddleware, transactionController.createTransaction);

// Listar todas las transacciones del usuario
router.get('/', authMiddleware, transactionController.getAllTransactions);

// Obtener transacción específica
router.get('/:id', authMiddleware, transactionController.getTransactionById);

// Actualizar transacción
router.put('/:id', authMiddleware, transactionController.updateTransaction);

// Soft delete
router.delete('/:id', authMiddleware, transactionController.softDeleteTransaction);

// Restaurar transacción eliminada
router.post('/:id/restore', authMiddleware, transactionController.restoreTransaction);

// Eliminar permanentemente
router.delete('/:id/permanent', authMiddleware, transactionController.deleteTransactionPermanently);

module.exports = router;

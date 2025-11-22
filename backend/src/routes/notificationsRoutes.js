// ============================================
// RUTAS DE NOTIFICACIONES
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// Obtener todas las notificaciones del usuario
router.get(
  '/',
  authMiddleware,
  notificationsController.getNotifications
);

// Marcar notificación como leída
router.patch(
  '/:notificationId/read',
  authMiddleware,
  notificationsController.markAsRead
);

module.exports = router;

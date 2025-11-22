// ============================================
// RUTAS: SETTINGS (Configuraciones)
// ============================================
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middlewares/auth');

// todas las rutas de settings requieren autenticación
router.use(authenticate);

// GET /api/settings - Obtener configuraciones del usuario
router.get('/', settingsController.getSettings);

// PUT /api/settings - Actualizar toda la configuración
router.put('/', settingsController.updateSettings);

// PATCH /api/settings/:section - Actualizar solo una sección
// Ejemplo: PATCH /api/settings/profile, /api/settings/notifications, /api/settings/privacy
router.patch('/:section', settingsController.updateSettingsSection);

module.exports = router;

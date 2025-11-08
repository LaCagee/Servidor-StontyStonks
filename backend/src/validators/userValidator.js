// ============================================
// VALIDADORES DE USUARIO
// ============================================
const { body, validationResult } = require('express-validator');

// ==================== MIDDLEWARE PARA MANEJAR ERRORES ====================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

// ==================== VALIDADOR: ACTUALIZAR PERFIL ====================
const validateUpdateProfile = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  handleValidationErrors
];

// ==================== VALIDADOR: ACTUALIZAR EMAIL ====================
const validateUpdateEmail = [
  body('newEmail')
    .trim()
    .notEmpty().withMessage('El nuevo email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),

  handleValidationErrors
];

// ==================== VALIDADOR: ACTUALIZAR CONTRASEÑA ====================
const validateUpdatePassword = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),

  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número'),

  body('confirmPassword')
    .notEmpty().withMessage('Debe confirmar la nueva contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

// ==================== EXPORTAR ====================
module.exports = {
  validateUpdateProfile,
  validateUpdateEmail,
  validateUpdatePassword
};
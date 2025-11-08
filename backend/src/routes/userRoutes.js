const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const userValidator = require('../validators/userValidator');

//obtener perfil
router.get('/profile', authMiddleware, userController.getProfile);
//actualizar nombre
router.put('/profile/name', userValidator.validateUpdateProfile, authMiddleware, userController.updateProfile); 
//actualizar email
router.put('/profile/email', userValidator.validateUpdateEmail, authMiddleware, userController.updateEmail);
//actualizar password
router.put('/profile/password', userValidator.validateUpdatePassword, authMiddleware, userController.updatePassword);

//eliminar cuenta (aun no implementada) (extra)
//router.delete('/profile', authMiddleware, userController.deleteAccount);



module.exports = router;
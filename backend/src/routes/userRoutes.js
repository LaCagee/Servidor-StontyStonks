const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

//obtener perfil
router.get('/', authMiddleware, userController.getProfile);
//actualizar nombre
router.put('/', authMiddleware, userController.updateProfile); 
//actualizar email
router.put('/', authMiddleware, userController.updateEmail);
//actualizar password
router.put('/', authMiddleware, userController.updatePassword);

//eliminar cuenta (aun no implementada) (extra)
//router.delete('/', authMiddleware, userController.deleteAccount);



module.exports = router;
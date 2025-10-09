const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middlewares/authMiddleware');
// const userController = require('../controllers/userController');

// TODO: Implementar en A.2
// router.get('/profile', authMiddleware, userController.getProfile);

router.get('/', (req, res) => {
  res.json({ message: 'User routes - Coming soon' });
});

module.exports = router;
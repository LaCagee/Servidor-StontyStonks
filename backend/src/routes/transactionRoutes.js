const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middlewares/authMiddleware');
// const transactionController = require('../controllers/transactionController');

// TODO: Implementar en A.4
// router.post('/', authMiddleware, transactionController.create);
// router.get('/', authMiddleware, transactionController.getAll);

router.get('/', (req, res) => {
  res.json({ message: 'Transaction routes - Coming soon' });
});

module.exports = router;
// controllers/transactionController.js
const { Transaction, Category } = require('../models'); // Ajusta según tu estructura
const { Op } = require('sequelize');

// ============================
// Crear nueva transacción
// ============================
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, date, description, categoryId, tags } = req.body;
    const userId = req.user.id; // asumimos que authMiddleware pone req.user

    // Validar que la categoría exista y sea del tipo correcto
    if (categoryId) {
      const category = await Category.findOne({ where: { id: categoryId, isActive: true } });
      if (!category) {
        return res.status(400).json({ error: 'Categoría no válida' });
      }
      if (category.type !== 'both' && category.type !== type) {
        return res.status(400).json({ error: `Categoría incompatible con el tipo ${type}` });
      }
    }

    const transaction = await Transaction.create({
      userId,
      amount,
      type,
      date,
      description,
      categoryId: categoryId || null,
      tags: tags || [],
      categorySource: categoryId ? 'manual' : 'auto'
    });

    return res.status(201).json({ message: 'Transacción creada', transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al crear la transacción' });
  }
};

// ============================
// Obtener todas las transacciones del usuario
// ============================
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.findAll({
      where: { userId, isActive: true },
      order: [['date', 'DESC']]
    });

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

// ============================
// Obtener una transacción específica
// ============================
exports.getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    return res.status(200).json({ transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la transacción' });
  }
};

// ============================
// Actualizar una transacción
// ============================
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, type, date, description, categoryId, tags } = req.body;

    const transaction = await Transaction.findOne({ where: { id, userId } });
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    // Validar categoría si viene en la actualización
    if (categoryId) {
      const category = await Category.findOne({ where: { id: categoryId, isActive: true } });
      if (!category) {
        return res.status(400).json({ error: 'Categoría no válida' });
      }
      if (category.type !== 'both' && category.type !== type) {
        return res.status(400).json({ error: `Categoría incompatible con el tipo ${type}` });
      }
      transaction.categoryId = categoryId;
    }

    if (amount !== undefined) transaction.amount = amount;
    if (type) transaction.type = type;
    if (date) transaction.date = date;
    if (description !== undefined) transaction.description = description;
    if (tags !== undefined) transaction.tags = tags;

    await transaction.save();

    return res.status(200).json({ message: 'Transacción actualizada', transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar la transacción' });
  }
};

// ============================
// Soft delete de una transacción
// ============================
exports.softDeleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ where: { id, userId } });
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await transaction.softDelete();

    return res.status(200).json({ message: 'Transacción eliminada (soft delete)' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar la transacción' });
  }
};

// ============================
// Restaurar transacción eliminada
// ============================
exports.restoreTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ where: { id, userId } });
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await transaction.restore();

    return res.status(200).json({ message: 'Transacción restaurada', transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al restaurar la transacción' });
  }
};

// ============================
// Borrar transacción permanentemente
// ============================
exports.deleteTransactionPermanently = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ where: { id, userId } });
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await transaction.destroy({ force: true });

    return res.status(200).json({ message: 'Transacción eliminada permanentemente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar permanentemente la transacción' });
  }
};

// controllers/transactionController.js
const { Transaction, Category } = require('../models');
const { Op } = require('sequelize');

// ============================
// Crear nueva transacción
// ============================
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, date, description, categoryId, tags } = req.body;
    const userId = req.userId;

    // Validar que la categoría exista y sea del tipo correcto
    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(400).json({ error: 'Categoría no encontrada' });
    }

    if (!category.isActive) {
      return res.status(400).json({ error: 'Categoría no disponible' });
    }

    if (category.type !== 'both' && category.type !== type) {
      return res.status(400).json({
        error: `La categoría "${category.name}" es para ${category.type === 'income' ? 'ingresos' : 'gastos'}, no para ${type === 'income' ? 'ingresos' : 'gastos'}`
      });
    }
    // Asignar fuente de categoría, si viene vacia asignar 'manual' sino usar la proporcionada
    const categorySource = req.body.categorySource || 'manual';
    // Crear transacción
    const transaction = await Transaction.create({
      userId,
      amount,
      type,
      date: date || new Date(),
      description: description || null,
      categoryId,
      tags: tags || [],
      categorySource: categorySource // Asignar la fuente de categoría
    });

    // Obtener transacción completa con categoría
    const transactionWithCategory = await Transaction.findByPk(transaction.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color', 'type']
      }]
    });

    return res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaction: transactionWithCategory
    });

  } catch (error) {
    console.error('Error al crear transacción:', error);
    return res.status(500).json({
      error: 'Error al crear la transacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// Obtener todas las transacciones del usuario (con filtros y paginación)
// ============================
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      categoryId,
      type,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Construir filtros dinámicamente
    const where = {
      userId,
      isActive: true
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = new Date(startDate);  // >= startDate
      }
      if (endDate) {
        where.date[Op.lte] = new Date(endDate);    // <= endDate
      }
    }

    if (search) {
      where.description = {
        [Op.iLike]: `%${search}%`  // Búsqueda case-insensitive
      };
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Obtener transacciones
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color', 'type']
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calcular páginas totales
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return res.status(500).json({
      error: 'Error al obtener transacciones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// Obtener una transacción específica
// ============================
exports.getTransactionById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color', 'type']
      }]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    return res.status(200).json({ transaction });

  } catch (error) {
    console.error('Error al obtener transacción:', error);
    return res.status(500).json({
      error: 'Error al obtener la transacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// Actualizar una transacción
// ============================
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { amount, type, date, description, categoryId, tags } = req.body;

    // Buscar transacción
    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    // Si está eliminada (soft delete), no permitir editar
    if (!transaction.isActive) {
      return res.status(400).json({
        error: 'No se puede editar una transacción eliminada. Restáurala primero.'
      });
    }

    // Validar categoría si viene en la actualización
    if (categoryId !== undefined) {
      const category = await Category.findByPk(categoryId);

      if (!category || !category.isActive) {
        return res.status(400).json({ error: 'Categoría no válida' });
      }

      // Si también actualiza el tipo, validar compatibilidad
      const newType = type || transaction.type;
      if (category.type !== 'both' && category.type !== newType) {
        return res.status(400).json({
          error: `La categoría "${category.name}" no es compatible con el tipo ${newType}`
        });
      }

      transaction.categoryId = categoryId;
    }
    // Verificar si la categoría cambió para actualizar la fuente
    if (categoryId !== undefined && categoryId !== transaction.categoryId) {
      // Si cambió la categoría, marcarlo como 'corrected'
      transaction.categorySource = 'corrected';
    }
    // Actualizar solo campos enviados
    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (date !== undefined) transaction.date = date;
    if (description !== undefined) transaction.description = description;
    if (tags !== undefined) transaction.tags = tags;

    await transaction.save();

    // Obtener transacción actualizada con categoría
    const updatedTransaction = await Transaction.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color', 'type']
      }]
    });

    return res.status(200).json({
      message: 'Transacción actualizada exitosamente',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    return res.status(500).json({
      error: 'Error al actualizar la transacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// Soft delete de una transacción
// ============================
exports.softDeleteTransaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    if (!transaction.isActive) {
      return res.status(400).json({
        error: 'La transacción ya está eliminada'
      });
    }

    await transaction.softDelete();

    return res.status(200).json({
      message: 'Transacción eliminada exitosamente',
      transaction: {
        id: transaction.id,
        isActive: transaction.isActive,
        deletedAt: transaction.deletedAt
      }
    });

  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    return res.status(500).json({
      error: 'Error al eliminar la transacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// Restaurar transacción eliminada
// ============================
exports.restoreTransaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, userId },
      paranoid: false  // Esto permite encontrar transacciones soft-deleted 
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    if (transaction.isActive) {
      return res.status(400).json({
        error: 'La transacción no está eliminada'
      });
    }

    await transaction.restore();

    // Obtener transacción restaurada con categoría
    const restoredTransaction = await Transaction.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color', 'type']
      }]
    });

    return res.status(200).json({
      message: 'Transacción restaurada exitosamente',
      transaction: restoredTransaction
    });

  } catch (error) {
    console.error('Error al restaurar transacción:', error);
    return res.status(500).json({
      error: 'Error al restaurar la transacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// Borrar transacción permanentemente (NO RECOMENDADO)
// ============================
exports.deleteTransactionPermanently = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, userId },
      paranoid: false  // Esto permite encontrar transacciones soft-deleted

    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await transaction.destroy({ force: true });  // force: true elimina permanentemente

    return res.status(200).json({
      message: 'Transacción eliminada permanentemente',
      warning: 'Esta acción no se puede deshacer'
    });

  } catch (error) {
    console.error('Error al eliminar permanentemente:', error);
    return res.status(500).json({
      error: 'Error al eliminar permanentemente la transacción',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
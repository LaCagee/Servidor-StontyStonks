// ============================================
// MODELO: TRANSACTION (Transacciones) - CON SOPORTE PARA GOALS
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  // ==================== COLUMNAS ====================

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único de la transacción'
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del usuario dueño de la transacción'
  },

  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'El monto debe ser mayor a 0'
      },
      isDecimal: {
        msg: 'El monto debe ser un número válido'
      }
    },
    comment: 'Monto de la transacción'
  },

  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['income', 'expense']],
        msg: 'El tipo debe ser "income" o "expense"'
      }
    },
    comment: 'Tipo de transacción: income (ingreso) o expense (egreso)'
  },

  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Debe ser una fecha válida'
      }
    },
    comment: 'Fecha de la transacción'
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'La descripción no puede exceder 500 caracteres'
      }
    },
    comment: 'Descripción opcional de la transacción'
  },

  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la categoría asociada'
  },

  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'Etiquetas personalizadas para la transacción'
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Indica si la transacción está activa (soft delete)'
  },

  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
    comment: 'Fecha de eliminación (soft delete)'
  },

  categorySource: {
    type: DataTypes.ENUM('manual', 'auto', 'corrected'),
    allowNull: false,
    defaultValue: 'manual',
    field: 'category_source',
    comment: 'Origen de la categoría: manual, auto (sugerida) o corrected (corregida por usuario)'
  },

  // ========== NUEVO: VINCULACIÓN CON GOALS ==========
  goalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'goal_id',
    references: {
      model: 'goals',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la meta asociada (opcional, para vincular ingresos a metas)'
  }

}, {
  // ==================== OPCIONES ====================

  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
  paranoid: true,
  deletedAt: 'deleted_at',

  // ==================== ÍNDICES ====================

  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['date']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['goal_id']  
    },
    {
      fields: ['user_id', 'date']
    }
  ],

  scopes: {
    active: {
      where: { isActive: true }
    },
    income: {
      where: { type: 'income', isActive: true }
    },
    expense: {
      where: { type: 'expense', isActive: true }
    },
    byMonth: (year, month) => {
      const startDate = new Date(year, month - 1, 1); // Primer día del mes
      const endDate = new Date(year, month, 0);       // Último día del mes
      
      return {
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      };
    }
  }
});

// ==================== MÉTODOS DE INSTANCIA ====================

Transaction.prototype.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  await this.save();
};

Transaction.prototype.restore = async function () {
  this.isActive = true;
  this.deletedAt = null;
  await this.save();
};

Transaction.prototype.isIncome = function () {
  return this.type === 'income';
};

Transaction.prototype.isExpense = function () {
  return this.type === 'expense';
};

Transaction.prototype.getSignedAmount = function () {
  return this.type === 'income' ? this.amount : -this.amount;
};

// ==================== MÉTODOS ESTÁTICOS ====================

Transaction.getBalance = async function (userId) {
  const { Op } = require('sequelize');

  const income = await this.sum('amount', {
    where: {
      userId,
      type: 'income',
      isActive: true
    }
  }) || 0;

  const expense = await this.sum('amount', {
    where: {
      userId,
      type: 'expense',
      isActive: true
    }
  }) || 0;

  return {
    income,
    expense,
    balance: income - expense
  };
};

Transaction.getByCategory = async function (userId, categoryId) {
  const Category = require('./Category');

  return await this.findAll({
    where: {
      userId,
      categoryId,
      isActive: true
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'icon', 'color']
    }],
    order: [['date', 'DESC']]
  });
};

Transaction.getByDateRange = async function (userId, startDate, endDate) {
  const { Op } = require('sequelize');

  return await this.findAll({
    where: {
      userId,
      date: {
        [Op.between]: [startDate, endDate]
      },
      isActive: true
    },
    order: [['date', 'DESC']]
  });
};

Transaction.getCurrentMonth = async function (userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return await this.getByDateRange(userId, startOfMonth, endOfMonth);
};

Transaction.getSummaryByCategory = async function (userId, startDate, endDate) {
  const { Op } = require('sequelize');
  const Category = require('./Category');

  return await this.findAll({
    attributes: [
      'categoryId',
      'type',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'count']
    ],
    where: {
      userId,
      date: {
        [Op.between]: [startDate, endDate]
      },
      isActive: true
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'icon', 'color']
    }],
    group: ['categoryId', 'type', 'category.id', 'category.name', 'category.icon', 'category.color'],
    order: [[sequelize.literal('total'), 'DESC']]
  });
};

Transaction.searchByDescription = async function (userId, searchText) {
  const { Op } = require('sequelize');

  return await this.findAll({
    where: {
      userId,
      description: {
        [Op.iLike]: `%${searchText}%`
      },
      isActive: true
    },
    order: [['date', 'DESC']]
  });
};

// ========== NUEVO: MÉTODOS PARA GOALS ==========

// Obtener transacciones asociadas a una meta específica
Transaction.getByGoal = async function (userId, goalId) {
  return await this.findAll({
    where: {
      userId,
      goalId,
      isActive: true
    },
    order: [['date', 'DESC']]
  });
};

// Calcular total ahorrado para una meta
Transaction.getTotalForGoal = async function (userId, goalId) {
  const total = await this.sum('amount', {
    where: {
      userId,
      goalId,
      type: 'income',
      isActive: true
    }
  }) || 0;

  return parseFloat(total);
};

module.exports = Transaction;
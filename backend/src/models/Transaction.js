/*
FLUJO COMPLETO DE UNA TRANSACCIÓN:

1. Usuario registra un gasto/ingreso desde el frontend
   ↓
2. POST /api/transactions con datos:
   {
     amount: 50000,
     type: "expense",
     date: "2025-10-08",
     description: "Compra supermercado",
     category: "Alimentación"
   }
   ↓
3. Se guarda en tabla transactions:
   ┌────────────────────────────────────────────┐
   │ id: 1                                      │
   │ user_id: 1                                 │
   │ amount: 50000.00                           │
   │ type: expense                              │
   │ date: 2025-10-08                           │
   │ description: Compra supermercado           │
   │ category: Alimentación                     │
   │ tags: []                                   │
   │ is_active: true                            │
   │ deleted_at: null                           │
   │ category_source: manual                    │
   │ created_at: 2025-10-08T15:30:00Z           │
   │ updated_at: 2025-10-08T15:30:00Z           │
   └────────────────────────────────────────────┘
   ↓
4. Usuario ve la transacción en el dashboard
   GET /api/transactions → Lista todas las activas
   ↓
5a. Usuario EDITA la transacción:
    PUT /api/transactions/1
    → Actualiza campos
    → updated_at se actualiza automáticamente
    
5b. Usuario ELIMINA (soft delete):
    DELETE /api/transactions/1
    → is_active = false
    → deleted_at = 2025-10-08T16:00:00Z
    → Ya NO aparece en consultas normales
    
5c. Usuario RESTAURA transacción eliminada:
    POST /api/transactions/1/restore
    → is_active = true
    → deleted_at = null
    → Vuelve a aparecer
    
5d. Usuario ELIMINA PERMANENTE:
    DELETE /api/transactions/1?permanent=true
    → transaction.destroy({ force: true })
    → Se borra REALMENTE de la BD (no recomendado)

6. Cálculos automáticos:
   ┌──────────────────────────────────────┐
   │ Transaction.getBalance(userId: 1)    │
   │                                      │
   │ Income:  $100,000                    │
   │ Expense:  $50,000                    │
   │ Balance:  $50,000                    │
   └──────────────────────────────────────┘
   
7. Reportes y análisis:
   ┌──────────────────────────────────────────────┐
   │ Transaction.getSummaryByCategory()           │
   │                                              │
   │ Alimentación: $50,000 (15 transacciones)     │
   │ Transporte:   $20,000 (8 transacciones)      │
   │ Salud:        $10,000 (3 transacciones)      │
   └──────────────────────────────────────────────┘

MÉTODOS ÚTILES:

// Verificar tipo
transaction.isIncome()   → false (es expense)
transaction.isExpense()  → true

// Obtener monto con signo (para calcular balance)
transaction.getSignedAmount()  → -50000 (negativo porque es gasto)

// Soft delete
transaction.softDelete()  → is_active=false, deleted_at=NOW()

// Restaurar
transaction.restore()  → is_active=true, deleted_at=null

CONSULTAS COMUNES:

// Solo gastos activos
Transaction.scope('expense').findAll()

// Solo ingresos activos  
Transaction.scope('income').findAll()

// Balance del usuario
const balance = await Transaction.getBalance(userId)

// Transacciones del mes actual
const thisMonth = await Transaction.getCurrentMonth(userId)

// Buscar por descripción
const results = await Transaction.searchByDescription(userId, "super")

// Resumen por categoría
const summary = await Transaction.getSummaryByCategory(userId, startDate, endDate)
*/

// ============================================
// MODELO: TRANSACTION (Transacciones)
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
    type: DataTypes.DECIMAL(15, 2),  // 15 dígitos totales, 2 decimales
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
    type: DataTypes.ENUM('income', 'expense'),  // Solo estos 2 valores
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
    type: DataTypes.DATEONLY,  // Solo fecha, sin hora (YYYY-MM-DD)
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

  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Otros',
    validate: {
      notEmpty: {
        msg: 'La categoría no puede estar vacía'
      }
    },
    comment: 'Categoría de la transacción (Alimentación, Transporte, etc.)'
  },

  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),  // Array de strings en PostgreSQL
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
  }

}, {
  // ==================== OPCIONES ====================

  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true,
  underscored: true,

  // ==================== PARANOID (Soft Delete Automático) ====================
  paranoid: true,  // Activa soft delete automático
  deletedAt: 'deleted_at',  // Campo que usará para marcar como eliminado

  // ==================== ÍNDICES ====================

  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['date']
    },
    {
      fields: ['category']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['user_id', 'date']  // Índice compuesto para búsquedas por usuario y fecha
    }
  ],

  // ==================== SCOPES (Consultas Predefinidas) ====================

  scopes: {
    // Solo transacciones activas
    active: {
      where: { isActive: true }
    },

    // Solo ingresos
    income: {
      where: { type: 'income', isActive: true }
    },

    // Solo gastos
    expense: {
      where: { type: 'expense', isActive: true }
    },

    // Transacciones de un mes específico
    byMonth: (year, month) => ({
      where: sequelize.where(
        sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')),
        year
      ),
      where: sequelize.where(
        sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')),
        month
      )
    })
  }
});

// ==================== MÉTODOS DE INSTANCIA ====================

// Marcar como eliminada (soft delete manual)
Transaction.prototype.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  await this.save();
};

// Restaurar transacción eliminada
Transaction.prototype.restore = async function () {
  this.isActive = true;
  this.deletedAt = null;
  await this.save();
};

// Verificar si es ingreso
Transaction.prototype.isIncome = function () {
  return this.type === 'income';
};

// Verificar si es gasto
Transaction.prototype.isExpense = function () {
  return this.type === 'expense';
};

// Obtener monto con signo (+ para ingreso, - para gasto)
Transaction.prototype.getSignedAmount = function () {
  return this.type === 'income' ? this.amount : -this.amount;
};

// ==================== MÉTODOS ESTÁTICOS ====================

// Calcular balance de un usuario
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

// Obtener transacciones por categoría
Transaction.getByCategory = async function (userId, category) {
  return await this.findAll({
    where: {
      userId,
      category,
      isActive: true
    },
    order: [['date', 'DESC']]
  });
};

// Obtener transacciones de un rango de fechas
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

// Obtener transacciones del mes actual
Transaction.getCurrentMonth = async function (userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return await this.getByDateRange(userId, startOfMonth, endOfMonth);
};

// Obtener resumen por categoría
Transaction.getSummaryByCategory = async function (userId, startDate, endDate) {
  const { Op } = require('sequelize');

  return await this.findAll({
    attributes: [
      'category',
      'type',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      userId,
      date: {
        [Op.between]: [startDate, endDate]
      },
      isActive: true
    },
    group: ['category', 'type'],
    order: [[sequelize.literal('total'), 'DESC']]
  });
};

// Buscar transacciones por texto en descripción
Transaction.searchByDescription = async function (userId, searchText) {
  const { Op } = require('sequelize');

  return await this.findAll({
    where: {
      userId,
      description: {
        [Op.iLike]: `%${searchText}%`  // Búsqueda case-insensitive
      },
      isActive: true
    },
    order: [['date', 'DESC']]
  });
};

module.exports = Transaction;
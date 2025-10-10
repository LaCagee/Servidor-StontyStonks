/*
FLUJO COMPLETO DE UN PRESUPUESTO:

1. Usuario crea presupuesto para Octubre 2025
   ↓
   POST /api/budgets
   {
     category: "Alimentación",
     monthlyLimit: 200000,
     alertThreshold: 80,
     month: 10,
     year: 2025
   }
   ↓
2. Se guarda en tabla budgets:
   ┌────────────────────────────────────────────┐
   │ id: 1                                      │
   │ user_id: 1                                 │
   │ category: Alimentación                     │
   │ monthly_limit: 200000.00                   │
   │ alert_threshold: 80                        │
   │ month: 10                                  │
   │ year: 2025                                 │
   │ is_active: true                            │
   │ created_at: 2025-10-01T00:00:00Z           │
   └────────────────────────────────────────────┘
   ↓
3. Usuario registra gastos durante Octubre:
   ┌──────────────────────────────────────────┐
   │ Día 5:  $50,000 (Alimentación)           │
   │ Día 12: $80,000 (Alimentación)           │
   │ Día 20: $30,000 (Alimentación)           │
   │ Total:  $160,000                         │
   └──────────────────────────────────────────┘
   ↓
4. Dashboard calcula progreso en tiempo real:
   GET /api/budgets/1
   
   budget.calculateSpent() →
   ┌──────────────────────────────────────────┐
   │ currentSpent: 160000                     │
   │ monthlyLimit: 200000                     │
   │ remaining: 40000                         │
   │ percentage: 80.00%                       │
   │ isExceeded: false                        │
   │ shouldAlert: true ← 80% >= 80%           │
   └──────────────────────────────────────────┘
   
   ⚠️ ALERTA: "Has usado el 80% de tu presupuesto de Alimentación"
   ↓
5. Sistema calcula proyección (día 20 de 31):
   budget.getProjectedSpending() →
   ┌──────────────────────────────────────────┐
   │ dailyAverage: 8000 ($160k / 20 días)     │
   │ projectedTotal: 248000 ($8k * 31 días)   │
   │ willExceed: true                         │
   │ projectedExcess: 48000                   │
   └──────────────────────────────────────────┘
   
   ⚠️ ALERTA: "Si sigues gastando así, excederás el presupuesto en $48,000"
   ↓
6. Usuario sigue gastando:
   ┌──────────────────────────────────────────┐
   │ Día 25: $50,000 (Alimentación)           │
   │ Total:  $210,000                         │
   └──────────────────────────────────────────┘
   
   budget.calculateSpent() →
   ┌──────────────────────────────────────────┐
   │ currentSpent: 210000                     │
   │ monthlyLimit: 200000                     │
   │ remaining: -10000                        │
   │ percentage: 105.00%                      │
   │ isExceeded: true ✅                      │
   │ shouldAlert: true                        │
   └──────────────────────────────────────────┘
   
   🚨 ALERTA CRÍTICA: "Has excedido tu presupuesto de Alimentación en $10,000"
   ↓
7. Fin de mes (31 de Octubre):
   Job automático ejecuta:
   Budget.createNextMonthBudgets(userId)
   
   Crea presupuesto para Noviembre 2025:
   ┌────────────────────────────────────────────┐
   │ id: 2                                      │
   │ user_id: 1                                 │
   │ category: Alimentación                     │
   │ monthly_limit: 200000.00  ← Copiado        │
   │ alert_threshold: 80       ← Copiado        │
   │ month: 11                 ← Mes siguiente  │
   │ year: 2025                                 │
   │ is_active: true                            │
   └────────────────────────────────────────────┘

MÉTODOS ÚTILES:

// Ver presupuestos del mes actual
const current = await Budget.getCurrentMonthBudgets(userId)

// Ver presupuestos que deben alertar
const alerts = await Budget.getBudgetsRequiringAlert(userId)

// Ver presupuestos excedidos
const exceeded = await Budget.getExceededBudgets(userId)

// Ver resumen general
const summary = await Budget.getSummary(userId)
// {
//   totalLimit: 500000,
//   totalSpent: 350000,
//   totalRemaining: 150000,
//   overallPercentage: 70.00,
//   exceededCount: 1,
//   alertCount: 2
// }

// Proyección de gasto
const projection = await budget.getProjectedSpending()
// {
//   dailyAverage: 8000,
//   projectedTotal: 248000,
//   willExceed: true,
//   projectedExcess: 48000
// }

CASO ESPECIAL: Cambio de año

// Diciembre 2025 → Enero 2026
Budget.createNextMonthBudgets(userId)
→ Crea presupuestos con month=1, year=2026
*/
// ============================================
// MODELO: BUDGET (Presupuestos)
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
    // ==================== COLUMNAS ====================

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'ID único del presupuesto'
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
        comment: 'ID del usuario dueño del presupuesto'
    },

    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'category_id',
        references: {
            model: 'categories',
            key: 'id'
        },
        onDelete: 'RESTRICT',
        comment: 'ID de la categoría del presupuesto'
    },

    monthlyLimit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'monthly_limit',
        validate: {
            min: {
                args: [0.01],
                msg: 'El límite mensual debe ser mayor a 0'
            },
            isDecimal: {
                msg: 'El límite debe ser un número válido'
            }
        },
        comment: 'Límite de gasto mensual para esta categoría'
    },

    // NOTA: current_spent se CALCULA dinámicamente, NO se guarda en BD
    // Esto evita inconsistencias con las transacciones

    alertThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 80,
        field: 'alert_threshold',
        validate: {
            min: {
                args: [1],
                msg: 'El umbral de alerta debe ser al menos 1%'
            },
            max: {
                args: [100],
                msg: 'El umbral de alerta no puede exceder 100%'
            }
        },
        comment: 'Porcentaje de uso que dispara alertas (default: 80%)'
    },

    month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: {
                args: [1],
                msg: 'El mes debe estar entre 1 y 12'
            },
            max: {
                args: [12],
                msg: 'El mes debe estar entre 1 y 12'
            }
        },
        comment: 'Mes del presupuesto (1-12)'
    },

    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: {
                args: [2020],
                msg: 'El año debe ser válido'
            }
        },
        comment: 'Año del presupuesto'
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
        comment: 'Indica si el presupuesto está activo'
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 300],
                msg: 'La descripción no puede exceder 300 caracteres'
            }
        },
        comment: 'Descripción opcional del presupuesto'
    }

}, {
    // ==================== OPCIONES ====================

    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    underscored: true,

    // ==================== ÍNDICES ====================

    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['category_id']
        },
        {
            fields: ['month', 'year']
        },
        {
            fields: ['is_active']
        },
        {
            // Evitar presupuestos duplicados (misma categoría en el mismo mes/año)
            unique: true,
            fields: ['user_id', 'category_id', 'month', 'year'],
            name: 'unique_budget_per_category_month'
        }
    ]
});

// ==================== MÉTODOS DE INSTANCIA ====================

// Calcular gasto actual del presupuesto
Budget.prototype.calculateSpent = async function () {
    const Transaction = require('./Transaction');
    const { Op } = require('sequelize');

    const startDate = new Date(this.year, this.month - 1, 1);
    const endDate = new Date(this.year, this.month, 0);

    const currentSpent = await Transaction.sum('amount', {
        where: {
            userId: this.userId,
            categoryId: this.categoryId,
            type: 'expense',
            isActive: true,
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    }) || 0;

    const percentage = (currentSpent / this.monthlyLimit) * 100;
    const remaining = this.monthlyLimit - currentSpent;
    const isExceeded = currentSpent > this.monthlyLimit;

    return {
        currentSpent: parseFloat(currentSpent.toFixed(2)),
        monthlyLimit: parseFloat(this.monthlyLimit),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        isExceeded,
        shouldAlert: percentage >= this.alertThreshold
    };
};

// Verificar si debe alertar
Budget.prototype.shouldAlert = async function () {
    const spent = await this.calculateSpent();
    return spent.shouldAlert;
};

// Verificar si se excedió el presupuesto
Budget.prototype.isExceeded = async function () {
    const spent = await this.calculateSpent();
    return spent.isExceeded;
};

// Obtener días restantes del mes
Budget.prototype.getDaysRemainingInMonth = function () {
    const today = new Date();
    const lastDayOfMonth = new Date(this.year, this.month, 0);

    const diffTime = lastDayOfMonth - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
};

// Calcular proyección de gasto al final del mes
Budget.prototype.getProjectedSpending = async function () {
    const spent = await this.calculateSpent();
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(this.year, this.month, 0).getDate();

    if (dayOfMonth === 0) {
        return spent.currentSpent;
    }

    // Proyección: (gasto actual / días transcurridos) * días totales del mes
    const dailyAverage = spent.currentSpent / dayOfMonth;
    const projectedTotal = dailyAverage * daysInMonth;

    return {
        projectedTotal: parseFloat(projectedTotal.toFixed(2)),
        dailyAverage: parseFloat(dailyAverage.toFixed(2)),
        willExceed: projectedTotal > this.monthlyLimit,
        projectedExcess: projectedTotal > this.monthlyLimit
            ? parseFloat((projectedTotal - this.monthlyLimit).toFixed(2))
            : 0
    };
};

// Obtener información completa del presupuesto
Budget.prototype.getFullInfo = async function () {
    const Category = require('./Category');
    const spent = await this.calculateSpent();
    const projection = await this.getProjectedSpending();
    const daysRemaining = this.getDaysRemainingInMonth();

    // Obtener información de la categoría
    const category = await Category.findByPk(this.categoryId, {
        attributes: ['id', 'name', 'icon', 'color']
    });

    return {
        id: this.id,
        categoryId: this.categoryId,
        category,
        monthlyLimit: this.monthlyLimit,
        alertThreshold: this.alertThreshold,
        month: this.month,
        year: this.year,
        isActive: this.isActive,
        description: this.description,
        spent,
        projection,
        daysRemaining,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Desactivar presupuesto
Budget.prototype.deactivate = async function () {
    this.isActive = false;
    await this.save();
};

// Activar presupuesto
Budget.prototype.activate = async function () {
    this.isActive = true;
    await this.save();
};

// ==================== MÉTODOS ESTÁTICOS ====================

// Obtener presupuestos activos de un usuario
Budget.getActiveBudgets = async function (userId) {
    return await this.findAll({
        where: {
            userId,
            isActive: true
        },
        order: [['category', 'ASC']]
    });
};

// Obtener presupuestos del mes actual
Budget.getCurrentMonthBudgets = async function (userId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return await this.findAll({
        where: {
            userId,
            month: currentMonth,
            year: currentYear,
            isActive: true
        },
        order: [['category', 'ASC']]
    });
};

// Obtener presupuestos con información completa
Budget.getBudgetsWithInfo = async function (userId, month = null, year = null) {
    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    const budgets = await this.findAll({
        where: {
            userId,
            month: targetMonth,
            year: targetYear,
            isActive: true
        },
        order: [['category', 'ASC']]
    });

    const budgetsWithInfo = await Promise.all(
        budgets.map(async (budget) => await budget.getFullInfo())
    );

    return budgetsWithInfo;
};

// Obtener presupuestos que deben alertar
Budget.getBudgetsRequiringAlert = async function (userId) {
    const currentBudgets = await this.getCurrentMonthBudgets(userId);
    const alertBudgets = [];

    for (const budget of currentBudgets) {
        if (await budget.shouldAlert()) {
            const info = await budget.getFullInfo();
            alertBudgets.push(info);
        }
    }

    return alertBudgets;
};

// Obtener presupuestos excedidos
Budget.getExceededBudgets = async function (userId) {
    const currentBudgets = await this.getCurrentMonthBudgets(userId);
    const exceededBudgets = [];

    for (const budget of currentBudgets) {
        if (await budget.isExceeded()) {
            const info = await budget.getFullInfo();
            exceededBudgets.push(info);
        }
    }

    return exceededBudgets;
};

// Crear presupuestos para el próximo mes (basados en el mes actual)
Budget.createNextMonthBudgets = async function (userId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;

    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
    }

    const currentBudgets = await this.findAll({
        where: {
            userId,
            month: currentMonth,
            year: currentYear,
            isActive: true
        }
    });

    const newBudgets = [];

    for (const budget of currentBudgets) {
        const newBudget = await this.create({
            userId: budget.userId,
            categoryId: budget.categoryId,
            monthlyLimit: budget.monthlyLimit,
            alertThreshold: budget.alertThreshold,
            month: nextMonth,
            year: nextYear,
            description: budget.description
        });

        newBudgets.push(newBudget);
    }

    return newBudgets;
};

// Obtener resumen general de presupuestos
Budget.getSummary = async function (userId, month = null, year = null) {
    const budgetsWithInfo = await this.getBudgetsWithInfo(userId, month, year);

    const totalLimit = budgetsWithInfo.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const totalSpent = budgetsWithInfo.reduce((sum, b) => sum + b.spent.currentSpent, 0);
    const totalRemaining = totalLimit - totalSpent;
    const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    const exceededCount = budgetsWithInfo.filter(b => b.spent.isExceeded).length;
    const alertCount = budgetsWithInfo.filter(b => b.spent.shouldAlert).length;

    return {
        totalLimit: parseFloat(totalLimit.toFixed(2)),
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalRemaining: parseFloat(totalRemaining.toFixed(2)),
        overallPercentage: parseFloat(overallPercentage.toFixed(2)),
        totalBudgets: budgetsWithInfo.length,
        exceededCount,
        alertCount,
        budgets: budgetsWithInfo
    };
};

module.exports = Budget;
// ============================================
// MODELO: GOAL (Metas Financieras) - VERSIÓN FINAL
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Goal = sequelize.define('Goal', {
    // ==================== COLUMNAS ====================

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'ID único de la meta'
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
        comment: 'ID del usuario dueño de la meta'
    },

    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre de la meta no puede estar vacío'
            },
            len: {
                args: [3, 100],
                msg: 'El nombre debe tener entre 3 y 100 caracteres'
            }
        },
        comment: 'Nombre descriptivo de la meta'
    },

    targetAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'target_amount',
        validate: {
            min: {
                args: [0.01],
                msg: 'El monto objetivo debe ser mayor a 0'
            },
            isDecimal: {
                msg: 'El monto debe ser un número válido'
            }
        },
        comment: 'Monto objetivo a alcanzar'
    },

    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: {
                msg: 'Debe ser una fecha válida'
            }
        },
        comment: 'Fecha límite para alcanzar la meta (opcional)'
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
        comment: 'ID de la categoría asociada (opcional)'
    },

    status: {
        type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'paused', 'completed', 'cancelled']],
                msg: 'El estado debe ser: active, paused, completed o cancelled'
            }
        },
        comment: 'Estado de la meta'
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
        comment: 'Descripción opcional de la meta'
    }

}, {
    // ==================== OPCIONES ====================

    sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true,
    underscored: true,

    // ==================== ÍNDICES ====================

    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['deadline']
        },
        {
            fields: ['user_id', 'status']
        }
    ]
});

// ==================== MÉTODOS DE INSTANCIA ====================

/**
 * Calcular progreso actual de la meta
 * Usa el campo goal_id de transactions
 */
Goal.prototype.calculateProgress = async function () {
    const Transaction = require('./Transaction');

    // Aportes (expense con goal_id)
    const contributions = await Transaction.sum('amount', {
        where: {
            userId: this.userId,
            type: 'expense',
            goalId: this.id,
            isActive: true
        }
    }) || 0;

    // Retiros (income con goal_id)
    const withdrawals = await Transaction.sum('amount', {
        where: {
            userId: this.userId,
            type: 'income',
            goalId: this.id,
            isActive: true
        }
    }) || 0;

    const currentAmount = contributions - withdrawals;
    const percentage = (currentAmount / parseFloat(this.targetAmount)) * 100;
    const remaining = parseFloat(this.targetAmount) - currentAmount;

    return {
        currentAmount: parseFloat(currentAmount.toFixed(2)),
        targetAmount: parseFloat(this.targetAmount),
        remaining: parseFloat(Math.max(remaining, 0).toFixed(2)),
        percentage: parseFloat(Math.min(percentage, 100).toFixed(2)),
        isCompleted: currentAmount >= parseFloat(this.targetAmount)
    };
};

/**
 * Obtener días restantes hasta la fecha límite
 */
Goal.prototype.getDaysRemaining = function () {
    if (!this.deadline) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadline = new Date(this.deadline);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Verificar si la meta está vencida
 */
Goal.prototype.isOverdue = function () {
    if (!this.deadline) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadline = new Date(this.deadline);
    deadline.setHours(0, 0, 0, 0);

    return today > deadline && this.status !== 'completed';
};

/**
 * Verificar si está próxima a vencer (menos de 7 días)
 */
Goal.prototype.isNearDeadline = function () {
    const daysRemaining = this.getDaysRemaining();
    return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
};

/**
 * Marcar meta como completada
 */
Goal.prototype.markAsCompleted = async function () {
    this.status = 'completed';
    await this.save();
};

/**
 * Pausar meta
 */
Goal.prototype.pause = async function () {
    this.status = 'paused';
    await this.save();
};

/**
 * Reactivar meta
 */
Goal.prototype.activate = async function () {
    this.status = 'active';
    await this.save();
};

/**
 * Cancelar meta
 */
Goal.prototype.cancel = async function () {
    this.status = 'cancelled';
    await this.save();
};

/**
 * Obtener información completa (con progreso)
 */
Goal.prototype.getFullInfo = async function () {
    const Category = require('./Category');
    const progress = await this.calculateProgress();
    const daysRemaining = this.getDaysRemaining();

    let category = null;
    if (this.categoryId) {
        category = await Category.findByPk(this.categoryId, {
            attributes: ['id', 'name', 'icon', 'color']
        });
    }

    return {
        id: this.id,
        name: this.name,
        description: this.description,
        targetAmount: parseFloat(this.targetAmount),
        categoryId: this.categoryId,
        category,
        deadline: this.deadline,
        status: this.status,
        progress,
        daysRemaining,
        isOverdue: this.isOverdue(),
        isNearDeadline: this.isNearDeadline(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// ==================== MÉTODOS ESTÁTICOS ====================

/**
 * Obtener todas las metas activas de un usuario
 */
Goal.getActiveGoals = async function (userId) {
    return await this.findAll({
        where: {
            userId,
            status: 'active'
        },
        order: [
            [sequelize.literal('deadline IS NULL'), 'ASC'],
            ['deadline', 'ASC']
        ]
    });
};

/**
 * Obtener metas con progreso completo
 */
Goal.getGoalsWithProgress = async function (userId) {
    const goals = await this.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
    });

    const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => await goal.getFullInfo())
    );

    return goalsWithProgress;
};

/**
 * Obtener metas próximas a vencer
 */
Goal.getNearDeadlineGoals = async function (userId) {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await this.findAll({
        where: {
            userId,
            status: 'active',
            deadline: {
                [Op.between]: [today, sevenDaysFromNow]
            }
        },
        order: [['deadline', 'ASC']]
    });
};

/**
 * Obtener metas vencidas
 */
Goal.getOverdueGoals = async function (userId) {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.findAll({
        where: {
            userId,
            status: 'active',
            deadline: {
                [Op.lt]: today
            }
        },
        order: [['deadline', 'ASC']]
    });
};

/**
 * Obtener metas completadas
 */
Goal.getCompletedGoals = async function (userId) {
    return await this.findAll({
        where: {
            userId,
            status: 'completed'
        },
        order: [['updatedAt', 'DESC']]
    });
};

/**
 * Verificar automáticamente metas completadas
 */
Goal.checkAndCompleteGoals = async function (userId) {
    const activeGoals = await this.getActiveGoals(userId);
    const completedGoals = [];

    for (const goal of activeGoals) {
        const progress = await goal.calculateProgress();

        if (progress.isCompleted) {
            await goal.markAsCompleted();
            completedGoals.push(goal);
        }
    }

    return completedGoals;
};

module.exports = Goal;
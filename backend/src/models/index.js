// ============================================
// INDEX DE MODELOS - CON RELACIONES GOALS
// ============================================
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// ============================================
// IMPORTAR MODELOS
// ============================================
const User = require('./User');
const Token = require('./Token');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Goal = require('./Goal');
const Budget = require('./Budget');

// ============================================
// DEFINIR RELACIONES (FOREIGN KEYS)
// ============================================

// 1. USER - TOKEN (1:N)
User.hasMany(Token, {
  foreignKey: 'userId',
  as: 'tokens',
  onDelete: 'CASCADE'
});

Token.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 2. USER - TRANSACTION (1:N)
User.hasMany(Transaction, {
  foreignKey: 'userId',
  as: 'transactions',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 3. CATEGORY - TRANSACTION (1:N)
Category.hasMany(Transaction, {
  foreignKey: 'categoryId',
  as: 'transactions',
  onDelete: 'SET NULL'
});

Transaction.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

// 4. USER - GOAL (1:N)
User.hasMany(Goal, {
  foreignKey: 'userId',
  as: 'goals',
  onDelete: 'CASCADE'
});

Goal.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 5. CATEGORY - GOAL (1:N)
Category.hasMany(Goal, {
  foreignKey: 'categoryId',
  as: 'goals',
  onDelete: 'SET NULL'
});

Goal.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

// 6. GOAL - TRANSACTION (1:N) ← NUEVA RELACIÓN
Goal.hasMany(Transaction, {
  foreignKey: 'goalId',
  as: 'transactions',
  onDelete: 'SET NULL'
});

Transaction.belongsTo(Goal, {
  foreignKey: 'goalId',
  as: 'goal'
});

// 7. USER - BUDGET (1:N)
User.hasMany(Budget, {
  foreignKey: 'userId',
  as: 'budgets',
  onDelete: 'CASCADE'
});

Budget.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 8. CATEGORY - BUDGET (1:N)
Category.hasMany(Budget, {
  foreignKey: 'categoryId',
  as: 'budgets',
  onDelete: 'RESTRICT'
});

Budget.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

// ============================================
// EXPORTAR MODELOS Y SEQUELIZE
// ============================================
module.exports = {
  sequelize,
  User,
  Token,
  Category,
  Transaction,
  Goal,
  Budget
};
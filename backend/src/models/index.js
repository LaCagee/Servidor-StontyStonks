/*
index.js hace esto:
┌─────────────────────────────────────┐
│  1. Importa config/database.js      │
│  2. Importa User.js, Token.js, etc. │
│  3. Define relaciones:              │
│     • User → Token (1:N)            │
│     • User → Transaction (1:N)      │
│     • User → Goal (1:N)             │
│     • User → Budget (1:N)           │
│  4. Exporta todo                    │
└─────────────────────────────────────┘
*/
// ============================================
// IMPORTACIONES
// ============================================
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// ============================================
// IMPORTAR MODELOS
// ============================================
// Importamos cada modelo (los crearemos después)
const User = require('./User');
const Token = require('./Token');
const Transaction = require('./Transaction');
const Goal = require('./Goal');
const Budget = require('./Budget');

// ============================================
// DEFINIR RELACIONES (FOREIGN KEYS)
// ============================================

// 1. USER - TOKEN (1:N - Un usuario puede tener muchos tokens)
User.hasMany(Token, {
  foreignKey: 'userId',  // Columna en la tabla 'tokens'
  as: 'tokens',          // Alias para hacer queries
  onDelete: 'CASCADE'    // Si eliminas un user, elimina sus tokens
});

Token.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 2. USER - TRANSACTION (1:N - Un usuario puede tener muchas transacciones)
User.hasMany(Transaction, {
  foreignKey: 'userId',
  as: 'transactions',
  onDelete: 'CASCADE'    // Si eliminas un user, elimina sus transacciones
});

Transaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 3. USER - GOAL (1:N - Un usuario puede tener muchas metas)
User.hasMany(Goal, {
  foreignKey: 'userId',
  as: 'goals',
  onDelete: 'CASCADE'
});

Goal.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 4. USER - BUDGET (1:N - Un usuario puede tener muchos presupuestos)
User.hasMany(Budget, {
  foreignKey: 'userId',
  as: 'budgets',
  onDelete: 'CASCADE'
});

Budget.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ============================================
// EXPORTAR MODELOS Y SEQUELIZE
// ============================================
module.exports = {
  sequelize,      // Instancia de Sequelize (para sync, authenticate, etc.)
  User,
  Token,
  Transaction,
  Goal,
  Budget
};
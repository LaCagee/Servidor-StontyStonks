// ============================================
// MODELO: SETTINGS (Configuraciones del usuario)
// ============================================
// aca guardamos las preferencias de cada usuario como idioma,
// notificaciones, privacidad, etc.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
  // ==================== COLUMNAS ====================

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único de la configuración'
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // cada usuario solo tiene una fila de configuraciones
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE', // si se borra el usuario, se borra su config
    comment: 'ID del usuario dueño de esta configuración'
  },

  // ==================== PREFERENCIAS DE PERFIL ====================

  language: {
    type: DataTypes.STRING(2),
    defaultValue: 'es',
    allowNull: false,
    validate: {
      isIn: {
        args: [['es', 'en']],
        msg: 'Idioma no soportado'
      }
    },
    comment: 'Idioma preferido (es, en)'
  },

  // ==================== NOTIFICACIONES ====================

  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'email_notifications',
    comment: 'Recibir notificaciones por email'
  },

  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'push_notifications',
    comment: 'Recibir notificaciones push'
  },

  monthlyReports: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'monthly_reports',
    comment: 'Recibir reportes mensuales automáticos'
  },

  budgetAlerts: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'budget_alerts',
    comment: 'Recibir alertas cuando se sobrepasa el presupuesto'
  },

  // ==================== PRIVACIDAD ====================

  dataSharing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'data_sharing',
    comment: 'Compartir datos anónimos para mejorar la app'
  },

  analytics: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Habilitar análisis inteligente de datos'
  }

}, {
  // ==================== OPCIONES ====================

  sequelize,
  modelName: 'Settings',
  tableName: 'settings',
  timestamps: true, // created_at y updated_at
  underscored: true
});

module.exports = Settings;

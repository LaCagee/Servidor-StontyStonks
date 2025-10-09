/*Flujo del completo de un token JWT:
1. Usuario hace login
   ↓
2. Se genera JWT string
   ↓
3. Se guarda en tabla tokens:
   ┌────────────────────────────────────┐
   │ id: 1                              │
   │ token: eyJhbGc...                  │
   │ user_id: 1                         │
   │ expires_at: 2025-10-09 06:00:00    │
   │ revoked_at: null                   │
   │ created_at: 2025-10-08 06:00:00    │
   └────────────────────────────────────┘
   ↓
4. Usuario hace peticiones con el token
   Middleware verifica: token.isValid() ✅
   ↓
5a. Usuario hace logout:
    token.revoke() → revoked_at = NOW()
   
5b. Token expira:
    Job de limpieza → Token.destroy()
*/


// ============================================
// MODELO: TOKEN (Tokens JWT)
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Token = sequelize.define('Token', {
  // ==================== COLUMNAS ====================
  
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único del token'
  },

  token: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,           // No puede haber tokens duplicados
    validate: {
      notEmpty: {
        msg: 'El token no puede estar vacío'
      }
    },
    comment: 'Token JWT generado'
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',       // En BD: user_id
    references: {
      model: 'users',       // Tabla a la que referencia
      key: 'id'
    },
    onDelete: 'CASCADE',    // Si eliminas el user, elimina sus tokens
    comment: 'ID del usuario dueño del token'
  },

  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
    validate: {
      isDate: {
        msg: 'Debe ser una fecha válida'
      },
      isFutureDate(value) {
        if (new Date(value) <= new Date()) {
          throw new Error('La fecha de expiración debe ser futura');
        }
      }
    },
    comment: 'Fecha y hora de expiración del token'
  },

  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'revoked_at',
    comment: 'Fecha y hora en que se revocó el token (logout manual)'
  }

}, {
  // ==================== OPCIONES ====================
  
  sequelize,
  modelName: 'Token',
  tableName: 'tokens',
  timestamps: true,         // Campos creados automaticamente created_at y updated_at
  underscored: true,
  
  // ==================== ÍNDICES ====================
  
  indexes: [
    {
      fields: ['user_id']   // Índice para búsquedas por usuario
    },
    {
      fields: ['token']      // Índice para búsquedas por token
    },
    {
      fields: ['expires_at'] // Índice para limpieza de tokens expirados
    }
  ]
});

// ==================== MÉTODOS DE INSTANCIA ====================

// Verificar si el token está expirado
Token.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Verificar si el token fue revocado manualmente
Token.prototype.isRevoked = function() {
  return this.revokedAt !== null;
};

// Verificar si el token es válido (no expirado ni revocado)
Token.prototype.isValid = function() {
  return !this.isExpired() && !this.isRevoked();
};

// Revocar token (logout)
Token.prototype.revoke = async function() {
  this.revokedAt = new Date();
  await this.save();
};

// ==================== MÉTODOS ESTÁTICOS ====================

// Buscar token válido por string
Token.findValidToken = async function(tokenString) {
  const token = await this.findOne({
    where: { token: tokenString }
  });
  
  if (!token) {
    return null;
  }
  
  // Verificar si es válido
  if (!token.isValid()) {
    return null;
  }
  
  return token;
};

// Eliminar todos los tokens expirados
Token.cleanExpiredTokens = async function() {
  const deleted = await this.destroy({
    where: {
      expiresAt: {
        [sequelize.Sequelize.Op.lt]: new Date() // lt = less than (menor que)
      }
    }
  });
  
  return deleted;
};

// Revocar todos los tokens de un usuario (logout de todos los dispositivos)
Token.revokeAllUserTokens = async function(userId) {
  const tokens = await this.findAll({
    where: { userId, revokedAt: null }
  });
  
  for (const token of tokens) {
    await token.revoke();
  }
  
  return tokens.length;
};

module.exports = Token;
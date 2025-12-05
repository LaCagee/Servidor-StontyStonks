/*Flujo de creación de un usuario:
User.create({ 
  email: 'test@test.com',
  name: 'Matias', 
  password: '12345678' 
})
         ↓
1. Valida email (isEmail)
2. Valida longitud password (min 8)
3. Hook beforeCreate → Hashea password
4. Guarda en PostgreSQL:
   ┌────────────────────────────────────┐
   │ id: 1                              │
   │ email: test@test.com               │
   │ name: Test                         │
   │ password: $2b$12$asdfasdf...       │
   │ email_verified: false              │
   │ verified_at: null                  │
   │ created_at: 2025-10-08T05:30:00Z   │
   │ updated_at: 2025-10-08T05:30:00Z   │
   └────────────────────────────────────┘
*/

// ============================================
// MODELO: USER (Usuarios)
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  // ==================== COLUMNAS ====================

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único del usuario'
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,        // Campo obligatorio, no puede ser nulo
    unique: true,            // No puede haber emails duplicados, debe ser único
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      },
      notEmpty: {
        msg: 'El email no puede estar vacío'
      }
    },
    comment: 'Email del usuario (único)'
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: true,           // Opcional al registrarse
    validate: {
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    },
    comment: 'Nombre completo del usuario'
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La contraseña no puede estar vacía'
      },
      len: {
        args: [8, 255],
        msg: 'La contraseña debe tener al menos 8 caracteres'
      }
    },
    comment: 'Contraseña hasheada con bcrypt'
  },

  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'email_verified',  // Nombre en BD: email_verified
    comment: 'Indica si el email fue verificado'
  },

  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at',
    comment: 'Fecha y hora de verificación del email'
  }

}, {
  // ==================== OPCIONES ====================

  sequelize,
  modelName: 'User',         // Nombre del modelo en JS
  tableName: 'users',        // Nombre de la tabla en PostgreSQL
  timestamps: true,          // Sequelize crea created_at y updated_at automáticamente y actualiza updated_at al modificar
  underscored: true,         // Convierte camelCase a snake_case en BD

  // ==================== HOOKS (Eventos) ====================

  hooks: {
    // ANTES de crear un usuario, hashear la contraseña
    beforeCreate: async (user) => {
      if (user.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    },
    /* Ejemplo de uso: (al momento de crear al usuario se le pasa la contraseña en texto plano y
        este hook la hashea sin que nosotros tengamos que hacerlo manualmente)
          await User.create({ email, password: '12345678' });
             //Sequelize hashea automáticamente antes de guardar
             //En BD queda: $2b$12$asfdasdfasdfasdfasdfasdfasdf...
    */

    // ANTES de actualizar, si cambió la contraseña, hashearla
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    }

  }
});

// ==================== MÉTODOS DE INSTANCIA ====================

// Método para comparar contraseñas
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
/* Ejemplo de uso:
    const user = await User.findByEmail('test@test.com'); // Buscar usuario por email y se guarda en user
    const isValid = await user.comparePassword('12345678'); // true si coincide, false si no    
*/

// Método para obtener usuario sin contraseña
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;  // Nunca devolver la contraseña en respuestas 
  return values;
};
/* Ejemplo de uso:
const user = await User.findOne({ where: { id: 1 } });
res.json(user);
// Respuesta SIN password: { id: 1, email: "test@test.com", emailVerified: false, ... } 
*/

// ==================== MÉTODOS ESTÁTICOS ====================

// Método para buscar usuario por email, metodo mas sencillo
User.findByEmail = async function (email) {
  return await this.findOne({ where: { email } });
};

// Método para verificar email
User.prototype.verifyEmail = async function () {
  this.emailVerified = true;
  this.verifiedAt = new Date();
  await this.save();
};

module.exports = User;
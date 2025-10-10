// ============================================
// MODELO: CATEGORY (Categorías del Sistema)
// ============================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  // ==================== COLUMNAS ====================
  
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único de la categoría'
  },

  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,  // No puede haber nombres duplicados
    validate: {
      notEmpty: {
        msg: 'El nombre de la categoría no puede estar vacío'
      },
      len: {
        args: [2, 50],
        msg: 'El nombre debe tener entre 2 y 50 caracteres'
      }
    },
    comment: 'Nombre de la categoría'
  },

  type: {
    type: DataTypes.ENUM('income', 'expense', 'both'),
    allowNull: false,
    defaultValue: 'expense',
    validate: {
      isIn: {
        args: [['income', 'expense', 'both']],
        msg: 'El tipo debe ser: income, expense o both'
      }
    },
    comment: 'Tipo: income (ingresos), expense (gastos) o both (ambos)'
  },

  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nombre del ícono para la UI (ej: shopping-cart, home, car)'
  },

  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: {
        args: /^#[0-9A-F]{6}$/i,
        msg: 'El color debe ser un código hexadecimal válido (ej: #FF5733)'
      }
    },
    comment: 'Color en hexadecimal para la UI'
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 200],
        msg: 'La descripción no puede exceder 200 caracteres'
      }
    },
    comment: 'Descripción opcional de la categoría'
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: 'Indica si la categoría está activa y disponible para usar'
  }

}, {
  // ==================== OPCIONES ====================
  
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  
  // ==================== ÍNDICES ====================
  
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['name']
    }
  ]
});

// ==================== MÉTODOS ESTÁTICOS ====================

// Obtener todas las categorías activas
Category.getActive = async function(type = null) {
  const { Op } = require('sequelize');
  
  const whereClause = {
    isActive: true
  };
  
  // Filtrar por tipo si se especifica
  if (type && type !== 'both') {
    whereClause.type = {
      [Op.or]: [type, 'both']  // Incluye categorías del tipo específico o 'both'
    };
  }
  
  return await this.findAll({
    where: whereClause,
    order: [['name', 'ASC']]
  });
};

// Obtener categorías para ingresos
Category.getIncomeCategories = async function() {
  return await this.getActive('income');
};

// Obtener categorías para gastos
Category.getExpenseCategories = async function() {
  return await this.getActive('expense');
};

// Crear categorías predefinidas del sistema
Category.createSystemCategories = async function() {
  const systemCategories = [
    // ========== CATEGORÍAS DE GASTOS ==========
    { 
      name: 'Alimentación', 
      type: 'expense', 
      icon: 'utensils', 
      color: '#FF6B6B',
      description: 'Supermercado, restaurantes, delivery'
    },
    { 
      name: 'Transporte', 
      type: 'expense', 
      icon: 'car', 
      color: '#4ECDC4',
      description: 'Combustible, transporte público, Uber, mantenimiento'
    },
    { 
      name: 'Vivienda', 
      type: 'expense', 
      icon: 'home', 
      color: '#45B7D1',
      description: 'Arriendo, hipoteca, servicios básicos, reparaciones'
    },
    { 
      name: 'Salud', 
      type: 'expense', 
      icon: 'heartbeat', 
      color: '#96CEB4',
      description: 'Medicamentos, consultas médicas, seguros de salud'
    },
    { 
      name: 'Educación', 
      type: 'expense', 
      icon: 'graduation-cap', 
      color: '#FFEAA7',
      description: 'Colegiaturas, cursos, libros, materiales'
    },
    { 
      name: 'Entretenimiento', 
      type: 'expense', 
      icon: 'film', 
      color: '#DFE6E9',
      description: 'Cine, streaming, salidas, hobbies'
    },
    { 
      name: 'Servicios', 
      type: 'expense', 
      icon: 'bolt', 
      color: '#74B9FF',
      description: 'Luz, agua, gas, internet, teléfono'
    },
    { 
      name: 'Ropa', 
      type: 'expense', 
      icon: 'tshirt', 
      color: '#FD79A8',
      description: 'Vestimenta, calzado, accesorios'
    },
    { 
      name: 'Tecnología', 
      type: 'expense', 
      icon: 'laptop', 
      color: '#A29BFE',
      description: 'Dispositivos, software, suscripciones tecnológicas'
    },
    { 
      name: 'Mascotas', 
      type: 'expense', 
      icon: 'paw', 
      color: '#FD79A8',
      description: 'Veterinario, alimento, accesorios'
    },
    { 
      name: 'Seguros', 
      type: 'expense', 
      icon: 'shield-alt', 
      color: '#0984E3',
      description: 'Seguros de vida, hogar, auto'
    },
    { 
      name: 'Otros Gastos', 
      type: 'expense', 
      icon: 'ellipsis-h', 
      color: '#636E72',
      description: 'Gastos varios no categorizados'
    },
    
    // ========== CATEGORÍAS DE INGRESOS ==========
    { 
      name: 'Salario', 
      type: 'income', 
      icon: 'money-bill-wave', 
      color: '#00B894',
      description: 'Sueldo mensual, bonos, aguinaldo'
    },
    { 
      name: 'Freelance', 
      type: 'income', 
      icon: 'briefcase', 
      color: '#00CEC9',
      description: 'Trabajos independientes, proyectos'
    },
    { 
      name: 'Inversiones', 
      type: 'income', 
      icon: 'chart-line', 
      color: '#FDCB6E',
      description: 'Dividendos, intereses, ganancias de capital'
    },
    { 
      name: 'Ventas', 
      type: 'income', 
      icon: 'shopping-bag', 
      color: '#E17055',
      description: 'Venta de productos o servicios'
    },
    { 
      name: 'Regalos', 
      type: 'income', 
      icon: 'gift', 
      color: '#FD79A8',
      description: 'Dinero recibido como regalo'
    },
    { 
      name: 'Otros Ingresos', 
      type: 'income', 
      icon: 'plus-circle', 
      color: '#55EFC4',
      description: 'Ingresos varios no categorizados'
    }
  ];
  
  let created = 0;
  let existing = 0;
  
  for (const category of systemCategories) {
    const [cat, wasCreated] = await this.findOrCreate({
      where: { name: category.name },
      defaults: category
    });
    
    if (wasCreated) {
      created++;
    } else {
      existing++;
    }
  }
  
  console.log(`✅ Categorías del sistema: ${created} creadas, ${existing} ya existían`);
  
  return { created, existing, total: systemCategories.length };
};

module.exports = Category;
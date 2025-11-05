// ============================================
// DICCIONARIO DE PALABRAS CLAVE POR CATEGORÍA
// ============================================

/**
 * Estructura del diccionario:
 * - key: ID de la categoría (debe coincidir con Category.id en BD)
 * - value: Array de palabras clave (keywords) asociadas
 * 
 * IMPORTANTE: Los IDs deben coincidir con las categorías del sistema
 * creadas en Category.createSystemCategories()
 */

const CATEGORY_KEYWORDS = {
  // ========== CATEGORÍAS DE GASTOS ==========
  
  // Alimentación (ID: 1)
  1: [
    // Supermercado
    'supermercado', 'super', 'mercado', 'almacen', 'bodega', 'minimarket',
    'jumbo', 'lider', 'tottus', 'unimarc', 'santa isabel', 'acuenta',
    
    // Restaurantes
    'restaurante', 'restaurant', 'comida', 'almuerzo', 'cena', 'desayuno',
    'cafe', 'cafeteria', 'bar', 'pub', 'pizza', 'sushi', 'hamburgues',
    
    // Delivery
    'pedidosya', 'ubereats', 'rappi', 'delivery', 'domicilio',
    
    // Productos
    'verduras', 'frutas', 'carne', 'pollo', 'pescado', 'pan', 'leche',
    'huevos', 'arroz', 'fideos', 'pasta', 'bebidas', 'snack', 'dulces',
    
    // Generales
    'comestibles', 'alimentos', 'compras', 'despensa'
  ],
  
  // Transporte (ID: 2)
  2: [
    // Vehículo
    'combustible', 'bencina', 'gasolina', 'petroleo', 'diesel', 'copec', 'shell', 'esso',
    'auto', 'carro', 'vehiculo', 'coche', 'estacionamiento', 'parking', 'peaje', 'tag',
    'mecanico', 'taller', 'repuesto', 'neumatico', 'aceite', 'revision', 'tecnica',
    
    // Transporte público
    'metro', 'bus', 'micro', 'colectivo', 'transantiago', 'bip', 'tarjeta',
    'taxi', 'uber', 'didi', 'cabify', 'beat', 'viaje', 'traslado',
    
    // Lugares
    'aeropuerto', 'terminal', 'estacion',
    
    // Otros
    'bicicleta', 'patineta', 'scooter', 'grin', 'transporte'
  ],
  
  // Vivienda (ID: 3)
  3: [
    // Pagos recurrentes
    'arriendo', 'alquiler', 'renta', 'hipoteca', 'dividendo', 'credito',
    'condominio', 'gastos comunes', 'expensas', 'administracion',
    
    // Servicios básicos (nota: algunos van a "Servicios" pero pueden aparecer aquí)
    'luz', 'agua', 'gas', 'electricidad',
    
    // Mantenimiento
    'reparacion', 'plomero', 'gasfiter', 'electricista', 'pintura', 'pintor',
    'ferreteria', 'sodimac', 'easy', 'construccion', 'maestro',
    
    // Muebles y decoración
    'muebles', 'sofa', 'cama', 'mesa', 'silla', 'decoracion', 'cortina',
    'ikea', 'homy', 'falabella', 'paris', 'ripley',
    
    // Generales
    'casa', 'hogar', 'vivienda', 'departamento', 'habitacion'
  ],
  
  // Salud (ID: 4)
  4: [
    // Consultas y procedimientos
    'medico', 'doctor', 'consulta', 'clinica', 'hospital',
    'dentista', 'odontologo', 'ortodoncia', 'limpieza dental',
    'psicologo', 'terapeuta', 'terapia', 'psiquiatra',
    'kinesiologo', 'fisioterapeuta', 'nutricionista', 'oftalmologo',
    
    // Medicamentos
    'farmacia', 'cruz verde', 'salcobrand', 'ahumada', 'farmacias',
    'medicamento', 'remedio', 'pastilla', 'antibiotico', 'vitamina',
    'receta', 'prescripcion',
    
    // Seguros
    'isapre', 'fonasa', 'seguro salud', 'cobertura', 'reembolso',
    
    // Otros
    'vacuna', 'examen', 'laboratorio', 'resonancia', 'radiografia',
    'operacion', 'cirugia', 'hospitalizacion', 'emergencia', 'urgencia'
  ],
  
  // Educación (ID: 5)
  5: [
    // Instituciones
    'colegio', 'escuela', 'liceo', 'universidad', 'instituto', 'academia',
    'jardin', 'preescolar', 'parvulario',
    
    // Pagos
    'matricula', 'mensualidad', 'colegiatura', 'pension', 'arancel',
    
    // Materiales
    'libros', 'cuaderno', 'lapices', 'mochila', 'uniforme', 'utiles',
    'libreria', 'antartica', 'nacional',
    
    // Cursos
    'curso', 'taller', 'diplomado', 'capacitacion', 'seminario',
    'clases', 'profesor', 'tutor', 'particular',
    
    // Generales
    'educacion', 'estudio', 'aprendizaje', 'formacion'
  ],
  
  // Entretenimiento (ID: 6)
  6: [
    // Streaming
    'netflix', 'spotify', 'disney', 'amazon prime', 'hbo', 'paramount',
    'youtube premium', 'apple music', 'streaming', 'suscripcion',
    
    // Cine y teatro
    'cine', 'cinemark', 'hoyts', 'cinepolis', 'pelicula', 'entrada',
    'teatro', 'concierto', 'show', 'evento', 'ticket', 'ticketmaster',
    
    // Juegos
    'videojuego', 'playstation', 'xbox', 'nintendo', 'steam', 'epic games',
    'juego', 'gaming', 'consola',
    
    // Salidas
    'salida', 'recreacion', 'diversion', 'paseo', 'panorama',
    'parque', 'museo', 'zoologico', 'acuario',
    
    // Hobbies
    'hobby', 'club', 'gimnasio', 'deportes', 'fotografia', 'musica'
  ],
  
  // Servicios (ID: 7)
  7: [
    // Básicos
    'luz', 'electricidad', 'enel', 'cge', 'cgc', 'chilquinta',
    'agua', 'aguas andinas', 'esval', 'nuevosur',
    'gas', 'lipigas', 'abastible', 'gasco',
    
    // Telecomunicaciones
    'internet', 'wifi', 'banda ancha', 'fibra optica',
    'telefono', 'celular', 'movil', 'plan', 'prepago', 'postpago',
    'entel', 'movistar', 'claro', 'wom', 'vtr', 'mundo pacifico',
    
    // TV
    'cable', 'television', 'directv', 'movistar tv', 'claro tv',
    
    // Otros
    'servicio', 'cuenta', 'boleta', 'pago'
  ],
  
  // Ropa (ID: 8)
  8: [
    // Tiendas
    'falabella', 'ripley', 'paris', 'hm', 'zara', 'gap', 'forever21',
    'adidas', 'nike', 'puma', 'tienda', 'mall', 'retail',
    
    // Prendas
    'ropa', 'vestimenta', 'polera', 'pantalon', 'camisa', 'blusa',
    'vestido', 'falda', 'short', 'jeans', 'chaqueta', 'abrigo',
    
    // Calzado
    'zapato', 'zapatilla', 'sandalia', 'bota', 'calzado', 'zapateria',
    
    // Accesorios
    'accesorio', 'cartera', 'bolso', 'cinturon', 'gorro', 'bufanda',
    'guante', 'lentes', 'reloj', 'joya', 'anillo', 'collar'
  ],
  
  // Tecnología (ID: 9)
  9: [
    // Dispositivos
    'computador', 'notebook', 'laptop', 'pc', 'mac', 'imac',
    'tablet', 'ipad', 'celular', 'smartphone', 'iphone', 'samsung',
    'auricular', 'audifonos', 'parlante', 'camara', 'monitor', 'teclado',
    
    // Tiendas
    'falabella', 'paris', 'ripley', 'pc factory', 'sp digital',
    'apple', 'store', 'tecnologia', 'electronica',
    
    // Software
    'software', 'licencia', 'antivirus', 'office', 'adobe', 'microsoft',
    'google', 'icloud', 'almacenamiento', 'dropbox', 'drive',
    
    // Servicios tech
    'hosting', 'dominio', 'servidor', 'cloud', 'github', 'suscripcion'
  ],
  
  // Mascotas (ID: 10)
  10: [
    // Veterinaria
    'veterinario', 'veterinaria', 'vet', 'consulta', 'vacuna', 'control',
    'cirugia', 'esterilizacion', 'desparasitacion',
    
    // Alimento
    'alimento', 'comida', 'croqueta', 'concentrado', 'pedigree',
    'royal canin', 'proplan', 'champion', 'dogchow', 'catchow',
    
    // Accesorios
    'collar', 'correa', 'plato', 'cama', 'juguete', 'rascador',
    'transportadora', 'jaula', 'pecera', 'arena',
    
    // Tiendas
    'petshop', 'pet shop', 'veterinaria', 'tienda', 'mascotas',
    
    // Animales
    'perro', 'gato', 'mascota', 'cachorro', 'gatito', 'pez', 'ave'
  ],
  
  // Seguros (ID: 11)
  11: [
    // Tipos
    'seguro', 'poliza', 'prima', 'cobertura', 'aseguradora',
    'vida', 'hogar', 'auto', 'desgravamen',
    'incendio', 'robo', 'accidente', 'responsabilidad',
    
    // Compañías
    'consorcio', 'bci seguros', 'chilena consolidada', 'liberty',
    'metlife', 'penta', 'mapfre', 'sura', 'renta nacional'
  ],
  
  // Otros Gastos (ID: 12)
  12: [
    'varios', 'varios gastos', 'otros', 'miscelaneo', 'gasto',
    'compra', 'pago', 'cuota', 'deuda', 'prestamo'
  ],
  
  // ========== CATEGORÍAS DE INGRESOS ==========
  
  // Salario (ID: 13)
  13: [
    'sueldo', 'salario', 'pago', 'nomina', 'remuneracion',
    'honorarios', 'ingreso', 'deposito', 'liquidacion',
    'aguinaldo', 'gratificacion', 'bono', 'comision', 'incentivo',
    'trabajo', 'empleador', 'empresa', 'jefe'
  ],
  
  // Freelance (ID: 14)
  14: [
    'freelance', 'independiente', 'proyecto', 'cliente', 'trabajo',
    'boleta', 'factura', 'honorario', 'servicio', 'consultoria',
    'diseño', 'desarrollo', 'programacion', 'redaccion', 'fotografia'
  ],
  
  // Inversiones (ID: 15)
  15: [
    'inversion', 'dividendo', 'interes', 'renta', 'ganancia',
    'bolsa', 'accion', 'fondo', 'mutuo', 'deposito', 'plazo',
    'banco', 'bci', 'santander', 'chile', 'scotiabank', 'itau',
    'crypto', 'bitcoin', 'ethereum', 'trading', 'broker'
  ],
  
  // Ventas (ID: 16)
  16: [
    'venta', 'vendido', 'mercadolibre', 'yapo', 'facebook marketplace',
    'producto', 'articulo', 'usado', 'segunda mano', 'cliente',
    'negocio', 'tienda', 'comercio', 'emprendimiento'
  ],
  
  // Regalos (ID: 17)
  17: [
    'regalo', 'obsequio', 'donacion', 'ayuda', 'prestamo',
    'familiar', 'familia', 'amigo', 'papa', 'mama', 'hermano',
    'cumpleaños', 'navidad', 'aniversario', 'regalo'
  ],
  
  // Otros Ingresos (ID: 18)
  18: [
    'varios', 'varios ingresos', 'otros', 'extra', 'adicional',
    'devolucion', 'reembolso', 'reintegro', 'compensacion'
  ]
};

/**
 * Obtener palabras clave de una categoría
 * @param {number} categoryId - ID de la categoría
 * @returns {string[]} Array de palabras clave
 */
function getKeywordsForCategory(categoryId) {
  return CATEGORY_KEYWORDS[categoryId] || [];
}

/**
 * Obtener todas las categorías con sus palabras clave
 * @returns {Object} Diccionario completo
 */
function getAllKeywords() {
  return CATEGORY_KEYWORDS;
}

/**
 * Verificar si una categoría tiene palabras clave definidas
 * @param {number} categoryId - ID de la categoría
 * @returns {boolean}
 */
function hasKeywords(categoryId) {
  return categoryId in CATEGORY_KEYWORDS && CATEGORY_KEYWORDS[categoryId].length > 0;
}

module.exports = {
  CATEGORY_KEYWORDS,
  getKeywordsForCategory,
  getAllKeywords,
  hasKeywords
};
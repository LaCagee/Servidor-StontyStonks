/**
 * Utilidad centralizada para formateo de moneda en CLP
 */

/**
 * Formatea un número como moneda CLP con símbolo de peso
 * @param {number|string} value - El valor a formatear
 * @param {Object} options - Opciones de formateo
 * @param {boolean} options.showDecimals - Si se deben mostrar decimales (default: false)
 * @param {boolean} options.showSymbol - Si se debe mostrar el símbolo $ (default: true)
 * @param {boolean} options.compact - Si se debe usar formato compacto (K, M) (default: false)
 * @returns {string} El valor formateado como CLP
 */
export const formatCLP = (value, options = {}) => {
  const {
    showDecimals = false,
    showSymbol = true,
    compact = false
  } = options;

  // Convertir a número si es string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Validar que sea un número
  if (isNaN(numValue)) {
    return showSymbol ? '$0' : '0';
  }

  // Formato compacto (para cards con poco espacio)
  if (compact) {
    const absValue = Math.abs(numValue);
    let formattedValue;

    if (absValue >= 1000000) {
      formattedValue = (numValue / 1000000).toFixed(1) + 'M';
    } else if (absValue >= 1000) {
      formattedValue = (numValue / 1000).toFixed(1) + 'K';
    } else {
      formattedValue = numValue.toString();
    }

    return showSymbol ? `$${formattedValue}` : formattedValue;
  }

  // Formato estándar con Intl.NumberFormat
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: showDecimals ? 0 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(numValue);

  // Si no se quiere el símbolo, removerlo
  if (!showSymbol) {
    return formatted.replace('$', '').trim();
  }

  return formatted;
};

/**
 * Formatea un número como CLP sin el símbolo de peso
 * @param {number|string} value - El valor a formatear
 * @returns {string} El valor formateado sin símbolo
 */
export const formatCLPWithoutSymbol = (value) => {
  return formatCLP(value, { showSymbol: false });
};

/**
 * Formatea un número como CLP en formato compacto (K, M)
 * @param {number|string} value - El valor a formatear
 * @returns {string} El valor formateado en formato compacto
 */
export const formatCLPCompact = (value) => {
  return formatCLP(value, { compact: true });
};

/**
 * Parsea una string de CLP a número
 * @param {string} value - El valor en formato CLP a parsear
 * @returns {number} El valor numérico
 */
export const parseCLP = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  // Remover símbolo de peso, puntos de miles y reemplazar coma decimal por punto
  const cleaned = value
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();

  return parseFloat(cleaned) || 0;
};

/**
 * Valida si un valor es un monto CLP válido
 * @param {number|string} value - El valor a validar
 * @returns {boolean} True si es válido, false en caso contrario
 */
export const isValidCLP = (value) => {
  const numValue = typeof value === 'string' ? parseCLP(value) : value;
  return !isNaN(numValue) && isFinite(numValue);
};

/**
 * Formatea un porcentaje
 * @param {number} value - El valor del porcentaje (0-100)
 * @param {number} decimals - Cantidad de decimales (default: 1)
 * @returns {string} El porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0%';
  }

  return `${numValue.toFixed(decimals)}%`;
};

export default {
  formatCLP,
  formatCLPWithoutSymbol,
  formatCLPCompact,
  parseCLP,
  isValidCLP,
  formatPercentage
};

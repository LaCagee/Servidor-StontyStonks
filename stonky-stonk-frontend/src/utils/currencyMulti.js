// ============================================
// FORMATEO DE MONEDA MULTI-DIVISA
// ============================================
// aca manejamos el formateo de diferentes monedas según la configuración del usuario

// configuraciones de monedas soportadas
const CURRENCY_CONFIGS = {
  CLP: {
    code: 'CLP',
    locale: 'es-CL',
    symbol: '$',
    name: 'Peso Chileno',
    decimals: 0
  },
  USD: {
    code: 'USD',
    locale: 'en-US',
    symbol: '$',
    name: 'Dólar Americano',
    decimals: 2
  },
  EUR: {
    code: 'EUR',
    locale: 'es-ES',
    symbol: '€',
    name: 'Euro',
    decimals: 2
  },
  ARS: {
    code: 'ARS',
    locale: 'es-AR',
    symbol: '$',
    name: 'Peso Argentino',
    decimals: 2
  },
  MXN: {
    code: 'MXN',
    locale: 'es-MX',
    symbol: '$',
    name: 'Peso Mexicano',
    decimals: 2
  },
  BRL: {
    code: 'BRL',
    locale: 'pt-BR',
    symbol: 'R$',
    name: 'Real Brasileño',
    decimals: 2
  }
};

/**
 * Formatea un número como moneda según la configuración
 * @param {number|string} value - El valor a formatear
 * @param {string} currencyCode - Código de la moneda (CLP, USD, EUR, etc.)
 * @param {Object} options - Opciones de formateo
 * @param {boolean} options.showSymbol - Si se debe mostrar el símbolo (default: true)
 * @param {boolean} options.compact - Si se debe usar formato compacto (K, M) (default: false)
 * @returns {string} El valor formateado
 */
export const formatCurrency = (value, currencyCode = 'CLP', options = {}) => {
  const {
    showSymbol = true,
    compact = false
  } = options;

  // obtener config de la moneda
  const currencyConfig = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.CLP;

  // convertir a número si es string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // validar que sea un número
  if (isNaN(numValue)) {
    return showSymbol ? `${currencyConfig.symbol}0` : '0';
  }

  // formato compacto (pa cuando el número es muy grande y queremos tipo "$1.5M")
  if (compact) {
    const absValue = Math.abs(numValue);
    let formattedValue;

    if (absValue >= 1000000) {
      formattedValue = (numValue / 1000000).toFixed(1) + 'M';
    } else if (absValue >= 1000) {
      formattedValue = (numValue / 1000).toFixed(1) + 'K';
    } else {
      formattedValue = numValue.toFixed(currencyConfig.decimals);
    }

    return showSymbol ? `${currencyConfig.symbol}${formattedValue}` : formattedValue;
  }

  // formato estándar con Intl.NumberFormat (esto es super cool de JS)
  const formatted = new Intl.NumberFormat(currencyConfig.locale, {
    style: 'currency',
    currency: currencyConfig.code,
    minimumFractionDigits: currencyConfig.decimals,
    maximumFractionDigits: currencyConfig.decimals
  }).format(numValue);

  // si no queremos el símbolo, lo sacamos
  if (!showSymbol) {
    // reemplazar todos los símbolos posibles
    return formatted
      .replace(currencyConfig.symbol, '')
      .replace('$', '')
      .replace('€', '')
      .replace('R$', '')
      .trim();
  }

  return formatted;
};

/**
 * Formatea un número como CLP (mantiene retrocompatibilidad)
 * @param {number|string} value - El valor a formatear
 * @param {Object} options - Opciones de formateo
 * @returns {string} El valor formateado como CLP
 */
export const formatCLP = (value, options = {}) => {
  return formatCurrency(value, 'CLP', options);
};

/**
 * Formatea sin el símbolo
 * @param {number|string} value - El valor a formatear
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} El valor formateado sin símbolo
 */
export const formatWithoutSymbol = (value, currencyCode = 'CLP') => {
  return formatCurrency(value, currencyCode, { showSymbol: false });
};

/**
 * Formatea en formato compacto (K, M)
 * @param {number|string} value - El valor a formatear
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} El valor formateado en formato compacto
 */
export const formatCompact = (value, currencyCode = 'CLP') => {
  return formatCurrency(value, currencyCode, { compact: true });
};

/**
 * Parsea una string de moneda a número
 * @param {string} value - El valor en formato de moneda a parsear
 * @returns {number} El valor numérico
 */
export const parseCurrency = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  // remover todos los símbolos y formateos posibles
  const cleaned = value
    .replace(/\$/g, '')
    .replace(/€/g, '')
    .replace(/R\$/g, '')
    .replace(/\./g, '') // quitar separador de miles
    .replace(/,/g, '.') // coma decimal a punto
    .trim();

  return parseFloat(cleaned) || 0;
};

/**
 * Valida si un valor es un monto válido
 * @param {number|string} value - El valor a validar
 * @returns {boolean} True si es válido, false en caso contrario
 */
export const isValidAmount = (value) => {
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;
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

/**
 * Obtiene la configuración de una moneda
 * @param {string} currencyCode - Código de la moneda
 * @returns {Object} Configuración de la moneda
 */
export const getCurrencyConfig = (currencyCode) => {
  return CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.CLP;
};

/**
 * Obtiene todas las monedas soportadas
 * @returns {Array} Array de monedas con sus configs
 */
export const getSupportedCurrencies = () => {
  return Object.values(CURRENCY_CONFIGS);
};

// retrocompatibilidad con currency.js antiguo
export const formatCLPWithoutSymbol = (value) => formatCLP(value, { showSymbol: false });
export const formatCLPCompact = (value) => formatCLP(value, { compact: true });
export const parseCLP = parseCurrency;
export const isValidCLP = isValidAmount;

export default {
  formatCurrency,
  formatCLP,
  formatWithoutSymbol,
  formatCompact,
  parseCurrency,
  isValidAmount,
  formatPercentage,
  getCurrencyConfig,
  getSupportedCurrencies,
  // retrocompatibilidad
  formatCLPWithoutSymbol,
  formatCLPCompact,
  parseCLP,
  isValidCLP
};

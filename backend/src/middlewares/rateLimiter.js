const rateLimit = require('express-rate-limit');

// Función para limpiar y extraer IP del header X-Forwarded-For de Azure
const getClientIp = (req) => {
  // Azure Container Apps envía X-Forwarded-For con formato: "IP:PORT, IP:PORT, IP"
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    // Tomar la primera IP de la lista
    const ips = forwardedFor.split(',');
    const firstIp = ips[0].trim();

    // Eliminar el puerto si existe (formato IP:PORT)
    const cleanIp = firstIp.split(':')[0];

    return cleanIp;
  }

  // Fallback a otras fuentes de IP
  return req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
};

// Rate limiter para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: {
    error: 'Demasiados intentos, por favor intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configuración para Azure Container Apps
  skip: (req) => {
    // No aplicar rate limit en desarrollo
    return process.env.NODE_ENV === 'development';
  },
  keyGenerator: getClientIp
});

// Rate limiter general para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limitar a 1000 solicitudes por ventana por IP
  message: {
    error: 'Demasiadas peticiones desde esta IP'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configuración para Azure Container Apps
  skip: (req) => {
    // No aplicar rate limit en desarrollo
    return process.env.NODE_ENV === 'development';
  },
  keyGenerator: getClientIp
});

module.exports = {
  authLimiter,
  apiLimiter
};

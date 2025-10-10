// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
const jwt = require('jsonwebtoken');
const { Token, User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    // 1. Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token no proporcionado'
      });
    }
    
    // Formato esperado: "Bearer eyJhbGc..."
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Formato de token inválido. Use: Bearer [token]'
      });
    }
    
    const token = parts[1];
    
    // 2. Verificar firma del JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado'
        });
      }
      
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    // 3. Verificar que el token existe en la base de datos (RF01e)
    const tokenRecord = await Token.findOne({
      where: {
        token,
        userId: decoded.userId
      }
    });
    
    if (!tokenRecord) {
      return res.status(401).json({
        error: 'Token inválido o revocado'
      });
    }
    
    // 4. Verificar que el token no esté expirado (doble check)
    if (tokenRecord.isExpired()) {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    // 5. Verificar que el token no esté revocado
    if (tokenRecord.isRevoked()) {
      return res.status(401).json({
        error: 'Token revocado'
      });
    }
    
    // 6. Verificar que el usuario existe
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }
    
    // 7. Token válido - Agregar información al request
    req.userId = decoded.userId;
    req.user = user;
    req.token = token;
    
    // 8. Continuar al siguiente middleware/controlador
    next();
    
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    res.status(500).json({
      error: 'Error al verificar autenticación',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = authMiddleware;

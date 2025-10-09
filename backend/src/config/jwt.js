require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Opciones para generación de tokens
  signOptions: {
    algorithm: 'HS256'
  },
  
  // Opciones para verificación
  verifyOptions: {
    algorithms: ['HS256']
  }
};
// ============================================
// GENERADOR DE TOKENS JWT
// ============================================
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ==================== GENERAR TOKEN JWT ====================
function generateAccessToken(userId) {
    const payload = {
        userId,
        type: 'access'
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return token;
}

// ==================== VERIFICAR TOKEN JWT ====================
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// ==================== GENERAR TOKEN DE RECUPERACIÓN ====================
function generateResetToken() {
    // Token aleatorio de 32 bytes en hexadecimal
    return crypto.randomBytes(32).toString('hex');
}

// ==================== CALCULAR FECHA DE EXPIRACIÓN ====================
function getTokenExpirationDate(hoursFromNow = 24) {
    const now = new Date();
    return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
}

// ==================== EXPORTAR ====================
module.exports = {
    generateAccessToken,
    verifyToken,
    generateResetToken,
    getTokenExpirationDate
};
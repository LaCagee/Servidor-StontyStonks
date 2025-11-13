const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ========== SEGURIDAD ==========
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== RUTAS API ==========
app.use('/api', routes);

// ========== SERVIR FRONTEND (PRODUCCIÓN) ==========
/*
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}
  */
// ========== RUTA RAÍZ ========== ruta de pruebas para probar el server corriendo
app.get((req, res) => {
  res.json({ 
    message: 'API StonkyStonk v1.0',
    status: 'Server running'
  });
});

// ========== RUTA DE SALUD ==========
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// ========== MANEJO DE ERRORES ==========
app.use(errorHandler);

module.exports = app;
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ========== SEGURIDAD ==========
app.use(helmet());

// Configuración CORS con múltiples orígenes permitidos
const allowedOrigins = [
  //'http://localhost:3000',  //habilitar para desarrollo local
  'https://wonderful-rock-0fdabe810.3.azurestaticapps.net',
  process.env.FRONTEND_URL
].filter(Boolean); // Eliminar valores undefined

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
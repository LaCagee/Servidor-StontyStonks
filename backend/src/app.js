const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ========== SEGURIDAD ==========
app.use(helmet());

// ========== CONFIGURACIÓN CORS PARA AZURE ==========
const allowedOrigins = [
  'https://wonderful-rock-0fdabe810.3.azurestaticapps.net',
  'http://localhost:5173', // Desarrollo local
  'http://localhost:3000'  // Desarrollo local
].filter(Boolean);

// Log de configuración (útil para debugging en Azure)
console.log('🌐 CORS - Orígenes permitidos:', allowedOrigins);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, algunos health checks)
    if (!origin) {
      console.log('✅ Request sin origin header - Permitido');
      return callback(null, true);
    }
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin permitido: ${origin}`);
      return callback(null, true);
    }
    
    // Rechazar origins no autorizados
    console.log(`❌ Origin NO permitido: ${origin}`);
    console.log(`📋 Orígenes válidos:`, allowedOrigins);
    callback(new Error(`CORS: Origin ${origin} no está permitido`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Cache de preflight por 24 horas
}));

// Handler explícito para OPTIONS (preflight requests)
app.options('*', cors());

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== DEBUG MIDDLEWARE (comentar en producción si afecta rendimiento) ==========
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log(`🌍 Origin: ${req.headers.origin || 'NO ORIGIN'}`);
    next();
  });
}

// ========== RUTAS API ==========
app.use('/api', routes);

// ========== RUTA DE SALUD (para Azure Health Probes) ==========
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// ========== RUTA RAÍZ ==========
app.get('/', (req, res) => {
  res.json({ 
    message: 'API StonkyStonk v1.0',
    status: 'Server running',
    timestamp: new Date().toISOString()
  });
});

// ========== MANEJO DE RUTAS NO ENCONTRADAS ==========
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// ========== MANEJO DE ERRORES ==========
app.use(errorHandler);

module.exports = app;
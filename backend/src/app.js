const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ========== SEGURIDAD ==========
app.use(helmet());

// ========== CONFIGURACIÓN CORS SIMPLIFICADA Y FUNCIONAL ==========
const allowedOrigins = [
  'https://wonderful-rock-0fdabe810.3.azurestaticapps.net',
  'http://localhost:5173',
  'http://localhost:3000'
];

console.log('🌐 CORS - Orígenes permitidos:', allowedOrigins);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// CORS configuración completa aplicada globalmente
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origin está permitido
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar CORS a TODAS las rutas
app.use(cors(corsOptions));

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== LOGGING DE REQUESTS (útil para debugging) ==========
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`🌍 Origin: ${req.headers.origin || 'NO ORIGIN'}`);
  
  // Log cuando se completa la respuesta
  res.on('finish', () => {
    console.log(`✅ ${req.method} ${req.path} → ${res.statusCode}`);
  });
  
  next();
});

// ========== RUTAS API ==========
app.use('/api', routes);

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled'
  });
});

// ========== RUTA RAÍZ ==========
app.get('/', (req, res) => {
  res.json({ 
    message: 'API StonkyStonk v1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    endpoints: {
      health: '/health',
      api: '/api'
    }
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
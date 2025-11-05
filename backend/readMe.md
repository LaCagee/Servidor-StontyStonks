# 🚀 Guía de API - Backend StonkyStonk

## 📍 Base URL
```
http://localhost:3000/api
```

---

## 🔐 AUTENTICACIÓN

| # | Método | Ruta | Descripción | Auth |
|---|--------|------|-------------|------|
| 1 | POST | `/auth/register` | Registrar nuevo usuario | No |
| 2 | POST | `/auth/verify-email` | Verificar email con token | No |
| 3 | POST | `/auth/resend-verification` | Reenviar email de verificación | No |
| 4 | POST | `/auth/login` | Iniciar sesión y obtener token JWT | No |
| 5 | GET | `/auth/profile` | Obtener perfil del usuario autenticado | Sí |
| 6 | POST | `/auth/logout` | Cerrar sesión y revocar token | Sí |
| 7 | POST | `/auth/forgot-password` | Solicitar recuperación de contraseña | No |
| 8 | POST | `/auth/reset-password` | Restablecer contraseña con token | No |

### Ejemplos

#### 1. Registro
**Parámetros obligatorios:** `email`, `password`, `confirmPassword`  
**Parámetros opcionales:** `name`
```http
POST /api/auth/register
Content-Type: application/json
```
```json
{
  "email": "usuario@mail.com",
  "name": "Juan Pérez",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```
**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.",
  "user": {
    "id": 1,
    "email": "usuario@mail.com",
    "name": "Juan Pérez",
    "emailVerified": false,
    "createdAt": "2025-11-05T10:30:00.000Z"
  }
}
```

#### 2. Verificar Email
**Parámetros obligatorios:** `token`
```http
POST /api/auth/verify-email
Content-Type: application/json
```
```json
{
  "token": "abc123def456..."
}
```
**Respuesta:**
```json
{
  "message": "Correo verificado exitosamente. ¡Ya puedes iniciar sesión!",
  "user": {
    "id": 1,
    "email": "usuario@mail.com",
    "name": "Juan Pérez",
    "emailVerified": true,
    "verifiedAt": "2025-11-05T10:35:00.000Z"
  }
}
```

#### 3. Reenviar Verificación
**Parámetros obligatorios:** `email`
```http
POST /api/auth/resend-verification
Content-Type: application/json
```
```json
{
  "email": "usuario@mail.com"
}
```
**Respuesta:**
```json
{
  "message": "Si el correo está registrado, recibirás un nuevo email de verificación"
}
```

#### 4. Login
**Parámetros obligatorios:** `email`, `password`
```http
POST /api/auth/login
Content-Type: application/json
```
```json
{
  "email": "usuario@mail.com",
  "password": "Password123"
}
```
**Respuesta:**
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-11-06T10:40:00.000Z",
  "user": {
    "id": 1,
    "email": "usuario@mail.com",
    "name": "Juan Pérez",
    "emailVerified": true
  }
}
```

#### 5. Perfil
**Parámetros:** Ninguno (requiere token en header)
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "user": {
    "id": 1,
    "email": "usuario@mail.com",
    "name": "Juan Pérez",
    "emailVerified": true,
    "verifiedAt": "2025-11-05T10:35:00.000Z",
    "createdAt": "2025-11-05T10:30:00.000Z",
    "updatedAt": "2025-11-05T10:35:00.000Z"
  }
}
```

#### 6. Logout
**Parámetros:** Ninguno (requiere token en header)
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

#### 7. Recuperar Contraseña
**Parámetros obligatorios:** `email`
```http
POST /api/auth/forgot-password
Content-Type: application/json
```
```json
{
  "email": "usuario@mail.com"
}
```
**Respuesta:**
```json
{
  "message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"
}
```

#### 8. Restablecer Contraseña
**Parámetros obligatorios:** `token`, `password`, `confirmPassword`
```http
POST /api/auth/reset-password
Content-Type: application/json
```
```json
{
  "token": "xyz789abc456...",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```
**Respuesta:**
```json
{
  "message": "Contraseña restablecida exitosamente. Por favor, inicia sesión con tu nueva contraseña."
}
```

---

## 📊 DASHBOARD

| # | Método | Ruta | Descripción | Auth |
|---|--------|------|-------------|------|
| 1 | GET | `/dashboard/overview` | Resumen completo del dashboard (balance + mes actual + categorías) | Sí |
| 2 | GET | `/dashboard/balance` | Balance general del usuario (ingresos, gastos, balance total) | Sí |
| 3 | GET | `/dashboard/current-month` | Resumen del mes actual con totales | Sí |
| 4 | GET | `/dashboard/by-category` | Gastos agrupados por categoría (con filtros de fecha) | Sí |
| 5 | GET | `/dashboard/monthly-trend` | Tendencia mensual de ingresos y gastos (últimos N meses) | Sí |

### Ejemplos

#### 1. Resumen General
**Parámetros:** Ninguno
```http
GET /api/dashboard/overview
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Dashboard overview obtenido exitosamente",
  "overview": {
    "balance": {
      "totalIncome": 1500000.00,
      "totalExpense": 800000.00,
      "currentBalance": 700000.00
    },
    "currentMonth": {
      "income": 500000.00,
      "expense": 300000.00,
      "balance": 200000.00,
      "transactionCount": 45
    },
    "topCategories": [
      {
        "categoryName": "Alimentación",
        "categoryIcon": "utensils",
        "categoryColor": "#FF6B6B",
        "total": 120000.00,
        "percentage": 40.00
      },
      {
        "categoryName": "Transporte",
        "categoryIcon": "car",
        "categoryColor": "#4ECDC4",
        "total": 80000.00,
        "percentage": 26.67
      }
    ]
  }
}
```

#### 2. Balance
**Parámetros:** Ninguno
```http
GET /api/dashboard/balance
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Balance obtenido exitosamente",
  "balance": {
    "income": 1500000.00,
    "expense": 800000.00,
    "balance": 700000.00
  }
}
```

#### 3. Resumen Mes Actual
**Parámetros:** Ninguno
```http
GET /api/dashboard/current-month
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Resumen del mes obtenido exitosamente",
  "period": {
    "month": 11,
    "monthName": "noviembre",
    "year": 2025
  },
  "summary": {
    "totalIncome": 500000.00,
    "totalExpense": 300000.00,
    "balance": 200000.00,
    "transactionCount": 45,
    "incomeCount": 5,
    "expenseCount": 40
  }
}
```

#### 4. Gastos por Categoría
**Parámetros obligatorios:** Ninguno  
**Parámetros opcionales:** `startDate`, `endDate` (formato: YYYY-MM-DD)
```http
GET /api/dashboard/by-category?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Gastos por categoría obtenidos exitosamente",
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "summary": {
    "totalExpenses": 300000.00,
    "totalIncome": 500000.00,
    "categoriesCount": 5
  },
  "categories": [
    {
      "categoryId": 1,
      "categoryName": "Alimentación",
      "categoryIcon": "utensils",
      "categoryColor": "#FF6B6B",
      "type": "expense",
      "total": 120000.00,
      "count": 15,
      "percentage": 40.00
    },
    {
      "categoryId": 2,
      "categoryName": "Transporte",
      "categoryIcon": "car",
      "categoryColor": "#4ECDC4",
      "type": "expense",
      "total": 80000.00,
      "count": 10,
      "percentage": 26.67
    }
  ]
}
```

#### 5. Tendencia Mensual
**Parámetros obligatorios:** Ninguno  
**Parámetros opcionales:** `months` (número de meses, default: 6, máx: 12)
```http
GET /api/dashboard/monthly-trend?months=6
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Tendencia mensual obtenida exitosamente",
  "period": {
    "startDate": "2025-06-01",
    "endDate": "2025-11-30",
    "months": 6
  },
  "totals": {
    "income": 3000000.00,
    "expense": 1800000.00,
    "balance": 1200000.00,
    "transactions": 270
  },
  "trend": [
    {
      "year": 2025,
      "month": 6,
      "monthName": "junio",
      "income": 450000.00,
      "expense": 280000.00,
      "balance": 170000.00,
      "transactionCount": 42
    },
    {
      "year": 2025,
      "month": 7,
      "monthName": "julio",
      "income": 500000.00,
      "expense": 300000.00,
      "balance": 200000.00,
      "transactionCount": 45
    }
  ]
}
```

---

## 🏷️ CATEGORÍAS

| # | Método | Ruta | Descripción | Auth |
|---|--------|------|-------------|------|
| 1 | GET | `/categories` | Obtener todas las categorías activas del sistema | Sí |
| 2 | GET | `/categories/income` | Obtener solo categorías de ingresos | Sí |
| 3 | GET | `/categories/expense` | Obtener solo categorías de gastos | Sí |
| 4 | GET | `/categories/:id` | Obtener información de una categoría específica | Sí |

### Ejemplos

#### 1. Obtener Todas
**Parámetros:** Ninguno
```http
GET /api/categories
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Categorías obtenidas exitosamente",
  "count": 18,
  "categories": [
    {
      "id": 1,
      "name": "Alimentación",
      "type": "expense",
      "icon": "utensils",
      "color": "#FF6B6B",
      "description": "Supermercado, restaurantes, delivery",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Transporte",
      "type": "expense",
      "icon": "car",
      "color": "#4ECDC4",
      "description": "Combustible, transporte público, Uber, mantenimiento",
      "isActive": true
    }
  ]
}
```

#### 2. Categorías de Ingresos
**Parámetros:** Ninguno
```http
GET /api/categories/income
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Categorías de ingresos obtenidas exitosamente",
  "count": 6,
  "categories": [
    {
      "id": 13,
      "name": "Salario",
      "type": "income",
      "icon": "money-bill-wave",
      "color": "#00B894",
      "description": "Sueldo mensual, bonos, aguinaldo",
      "isActive": true
    },
    {
      "id": 14,
      "name": "Freelance",
      "type": "income",
      "icon": "briefcase",
      "color": "#00CEC9",
      "description": "Trabajos independientes, proyectos",
      "isActive": true
    }
  ]
}
```

#### 3. Categorías de Gastos
**Parámetros:** Ninguno
```http
GET /api/categories/expense
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Categorías de gastos obtenidas exitosamente",
  "count": 12,
  "categories": [
    {
      "id": 1,
      "name": "Alimentación",
      "type": "expense",
      "icon": "utensils",
      "color": "#FF6B6B",
      "description": "Supermercado, restaurantes, delivery",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Transporte",
      "type": "expense",
      "icon": "car",
      "color": "#4ECDC4",
      "description": "Combustible, transporte público, Uber, mantenimiento",
      "isActive": true
    }
  ]
}
```

#### 4. Categoría por ID
**Parámetros obligatorios:** `id` (en la URL)
```http
GET /api/categories/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "category": {
    "id": 1,
    "name": "Alimentación",
    "type": "expense",
    "icon": "utensils",
    "color": "#FF6B6B",
    "description": "Supermercado, restaurantes, delivery",
    "isActive": true,
    "createdAt": "2025-11-05T10:00:00.000Z",
    "updatedAt": "2025-11-05T10:00:00.000Z"
  }
}
```

---

## 🤖 SUGERENCIAS DE CATEGORÍAS

| # | Método | Ruta | Descripción | Auth |
|---|--------|------|-------------|------|
| 1 | GET | `/suggestions` | Obtener múltiples sugerencias de categorías basadas en descripción | Sí |
| 2 | GET | `/suggestions/best` | Obtener la mejor sugerencia (solo 1) basada en descripción | Sí |
| 3 | GET | `/suggestions/validate` | Validar si una categoría es apropiada para un tipo de transacción | Sí |
| 4 | GET | `/suggestions/stats` | Obtener estadísticas del diccionario de palabras clave | Sí |
| 5 | POST | `/suggestions/test` | Probar sugerencias con múltiples descripciones (testing) | Sí |

### Ejemplos

#### 1. Obtener Sugerencias
**Parámetros obligatorios:** `description`, `type`  
**Parámetros opcionales:** `maxSuggestions` (default: 3, máx: 10), `minScore` (default: 10, máx: 100)
```http
GET /api/suggestions?description=uber santiago&type=expense&maxSuggestions=3
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Sugerencias obtenidas exitosamente",
  "description": "uber santiago",
  "type": "expense",
  "count": 3,
  "suggestions": [
    {
      "categoryId": 2,
      "categoryName": "Transporte",
      "categoryIcon": "car",
      "categoryColor": "#4ECDC4",
      "categoryType": "expense",
      "score": 85.50,
      "confidence": "high"
    },
    {
      "categoryId": 12,
      "categoryName": "Otros Gastos",
      "categoryIcon": "ellipsis-h",
      "categoryColor": "#636E72",
      "categoryType": "expense",
      "score": 15.00,
      "confidence": "low"
    }
  ]
}
```

#### 2. Mejor Sugerencia
**Parámetros obligatorios:** `description`, `type`
```http
GET /api/suggestions/best?description=netflix&type=expense
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Mejor sugerencia obtenida",
  "description": "netflix",
  "type": "expense",
  "suggestion": {
    "categoryId": 6,
    "categoryName": "Entretenimiento",
    "categoryIcon": "film",
    "categoryColor": "#DFE6E9",
    "categoryType": "expense",
    "score": 92.30,
    "confidence": "high"
  }
}
```

#### 3. Validar Categoría
**Parámetros obligatorios:** `categoryId`, `type`
```http
GET /api/suggestions/validate?categoryId=1&type=expense
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "categoryId": 1,
  "type": "expense",
  "isValid": true,
  "message": "La categoría es válida para este tipo de transacción"
}
```

#### 4. Estadísticas del Diccionario
**Parámetros:** Ninguno
```http
GET /api/suggestions/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Estadísticas del diccionario de palabras clave",
  "stats": {
    "totalCategories": 18,
    "totalKeywords": 847,
    "categoriesWithKeywords": 18,
    "avgKeywordsPerCategory": 47,
    "stopWordsCount": 22,
    "highSpecificityCount": 25,
    "categoryDetails": {
      "1": {
        "keywordCount": 58,
        "sampleKeywords": ["supermercado", "super", "mercado", "almacen", "bodega"]
      }
    }
  }
}
```

#### 5. Probar Sugerencias
**Parámetros obligatorios:** `descriptions` (array de strings), `type`
```http
POST /api/suggestions/test
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
```json
{
  "descriptions": [
    "uber centro",
    "jumbo compras",
    "netflix suscripcion"
  ],
  "type": "expense"
}
```
**Respuesta:**
```json
{
  "message": "Prueba de sugerencias completada",
  "type": "expense",
  "totalTests": 3,
  "results": [
    {
      "description": "uber centro",
      "suggestions": [
        {
          "categoryId": 2,
          "categoryName": "Transporte",
          "score": 85.50,
          "confidence": "high"
        }
      ],
      "bestMatch": {
        "categoryId": 2,
        "categoryName": "Transporte",
        "score": 85.50,
        "confidence": "high"
      }
    },
    {
      "description": "jumbo compras",
      "suggestions": [
        {
          "categoryId": 1,
          "categoryName": "Alimentación",
          "score": 78.20,
          "confidence": "high"
        }
      ],
      "bestMatch": {
        "categoryId": 1,
        "categoryName": "Alimentación",
        "score": 78.20,
        "confidence": "high"
      }
    }
  ]
}
```

---

## 💸 TRANSACCIONES

| # | Método | Ruta | Descripción | Auth |
|---|--------|------|-------------|------|
| 1 | POST | `/transactions` | Crear nueva transacción (ingreso o gasto) | Sí |
| 2 | GET | `/transactions` | Listar transacciones del usuario (con filtros y paginación) | Sí |
| 3 | GET | `/transactions/:id` | Obtener detalles de una transacción específica | Sí |
| 4 | PUT | `/transactions/:id` | Actualizar una transacción existente | Sí |
| 5 | DELETE | `/transactions/:id` | Eliminar transacción (soft delete) | Sí |
| 6 | POST | `/transactions/:id/restore` | Restaurar transacción eliminada | Sí |
| 7 | DELETE | `/transactions/:id/permanent` | Eliminar transacción permanentemente (no recomendado) | Sí |

### Ejemplos

#### 1. Crear Transacción
**Parámetros obligatorios:** `amount`, `type`, `categoryId`  
**Parámetros opcionales:** `date` (default: hoy), `description`, `tags`, `categorySource` (default: 'manual')
```http
POST /api/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
```json
{
  "amount": 50000,
  "type": "expense",
  "date": "2025-11-05",
  "description": "Compra supermercado",
  "categoryId": 1,
  "tags": ["comida", "super"],
  "categorySource": "manual"
}
```
**Respuesta:**
```json
{
  "message": "Transacción creada exitosamente",
  "transaction": {
    "id": 1,
    "userId": 1,
    "amount": 50000.00,
    "type": "expense",
    "date": "2025-11-05",
    "description": "Compra supermercado",
    "categoryId": 1,
    "tags": ["comida", "super"],
    "categorySource": "manual",
    "isActive": true,
    "deletedAt": null,
    "createdAt": "2025-11-05T15:30:00.000Z",
    "updatedAt": "2025-11-05T15:30:00.000Z",
    "category": {
      "id": 1,
      "name": "Alimentación",
      "icon": "utensils",
      "color": "#FF6B6B",
      "type": "expense"
    }
  }
}
```

#### 2. Listar Transacciones
**Parámetros obligatorios:** Ninguno  
**Parámetros opcionales:** `categoryId`, `type`, `startDate`, `endDate`, `search`, `page` (default: 1), `limit` (default: 50, máx: 100)
```http
GET /api/transactions?type=expense&startDate=2025-11-01&endDate=2025-11-30&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "transactions": [
    {
      "id": 1,
      "userId": 1,
      "amount": 50000.00,
      "type": "expense",
      "date": "2025-11-05",
      "description": "Compra supermercado",
      "categoryId": 1,
      "tags": ["comida", "super"],
      "categorySource": "manual",
      "isActive": true,
      "createdAt": "2025-11-05T15:30:00.000Z",
      "category": {
        "id": 1,
        "name": "Alimentación",
        "icon": "utensils",
        "color": "#FF6B6B",
        "type": "expense"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasMore": true
  }
}
```

#### 3. Ver Transacción
**Parámetros obligatorios:** `id` (en la URL)
```http
GET /api/transactions/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "transaction": {
    "id": 1,
    "userId": 1,
    "amount": 50000.00,
    "type": "expense",
    "date": "2025-11-05",
    "description": "Compra supermercado",
    "categoryId": 1,
    "tags": ["comida", "super"],
    "categorySource": "manual",
    "isActive": true,
    "deletedAt": null,
    "createdAt": "2025-11-05T15:30:00.000Z",
    "updatedAt": "2025-11-05T15:30:00.000Z",
    "category": {
      "id": 1,
      "name": "Alimentación",
      "icon": "utensils",
      "color": "#FF6B6B",
      "type": "expense"
    }
  }
}
```

#### 4. Actualizar Transacción
**Parámetros obligatorios:** `id` (en la URL)  
**Parámetros opcionales:** `amount`, `type`, `date`, `description`, `categoryId`, `tags`
```http
PUT /api/transactions/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
```json
{
  "amount": 55000,
  "description": "Compra supermercado (actualizado)",
  "tags": ["comida", "super", "urgente"]
}
```
**Respuesta:**
```json
{
  "message": "Transacción actualizada exitosamente",
  "transaction": {
    "id": 1,
    "userId": 1,
    "amount": 55000.00,
    "type": "expense",
    "date": "2025-11-05",
    "description": "Compra supermercado (actualizado)",
    "categoryId": 1,
    "tags": ["comida", "super", "urgente"],
    "categorySource": "manual",
    "isActive": true,
    "updatedAt": "2025-11-05T16:00:00.000Z",
    "category": {
      "id": 1,
      "name": "Alimentación",
      "icon": "utensils",
      "color": "#FF6B6B",
      "type": "expense"
    }
  }
}
```

#### 5. Eliminar (Soft Delete)
**Parámetros obligatorios:** `id` (en la URL)
```http
DELETE /api/transactions/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Transacción eliminada exitosamente",
  "transaction": {
    "id": 1,
    "isActive": false,
    "deletedAt": "2025-11-05T16:10:00.000Z"
  }
}
```

#### 6. Restaurar
**Parámetros obligatorios:** `id` (en la URL)
```http
POST /api/transactions/1/restore
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Transacción restaurada exitosamente",
  "transaction": {
    "id": 1,
    "userId": 1,
    "amount": 55000.00,
    "type": "expense",
    "date": "2025-11-05",
    "description": "Compra supermercado (actualizado)",
    "categoryId": 1,
    "tags": ["comida", "super", "urgente"],
    "isActive": true,
    "deletedAt": null,
    "category": {
      "id": 1,
      "name": "Alimentación",
      "icon": "utensils",
      "color": "#FF6B6B",
      "type": "expense"
    }
  }
}
```

#### 7. Eliminar Permanentemente
**Parámetros obligatorios:** `id` (en la URL)
```http
DELETE /api/transactions/1/permanent
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Respuesta:**
```json
{
  "message": "Transacción eliminada permanentemente",
  "warning": "Esta acción no se puede deshacer"
}
```

---

## 💡 CONSEJOS PARA FRONTEND

### 1. **Manejo del Token JWT**
```javascript
// Guardar después del login
localStorage.setItem('token', response.data.token);

// Usar en cada request
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### 2. **Interceptor de Axios (Recomendado)**
```javascript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar token expirado
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. **Flujo de Registro Completo**
```
1. POST /auth/register
2. Usuario recibe email
3. POST /auth/verify-email (con token del email)
4. POST /auth/login
5. Guardar token
6. Ya puede usar las rutas protegidas
```

### 4. **Sugerencias de Categorías (Usar en Formulario)**
```javascript
// Al escribir descripción, obtener sugerencia
const description = "uber centro";
const response = await axios.get(
  `/suggestions/best?description=${description}&type=expense`
);

// Mostrar como sugerencia: response.data.suggestion
// categoryId: response.data.suggestion.categoryId
```

### 5. **Paginación de Transacciones**
```javascript
const response = await axios.get(
  `/transactions?page=1&limit=20&type=expense`
);

// response.data.pagination: { total, page, limit, totalPages, hasMore }
```

### 6. **Manejo de Errores**
```javascript
try {
  await axios.post('/auth/login', { email, password });
} catch (error) {
  if (error.response?.data?.error) {
    // Mostrar error al usuario
    alert(error.response.data.error);
  }
}
```

---

## 🔥 IMPORTANTE

- ✅ **Token requerido:** Todas las rutas excepto las de autenticación pública requieren `Authorization: Bearer <token>`
- ⏰ **Expiración:** El token expira en 24 horas
- 📅 **Formato de fechas:** `YYYY-MM-DD`
- 💰 **Tipos de transacción:** `income` (ingresos) o `expense` (gastos)
- 🔢 **IDs de categoría:** Números enteros positivos (1, 2, 3...)
- 🔐 **Contraseñas:** Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número
- 📧 **Emails:** Deben ser válidos y únicos en el sistema
- 🏷️ **categorySource:** Valores posibles: `manual`, `auto`, `corrected`

✅ Endpoints Finales de Autenticación

POST   /api/auth/register              - Registrar (envía email de verificación)
POST   /api/auth/verify-email          - Verificar email con token
POST   /api/auth/resend-verification   - Reenviar email de verificación
POST   /api/auth/login                 - Iniciar sesión
POST   /api/auth/logout                - Cerrar sesión (requiere auth)
GET    /api/auth/profile               - Obtener perfil (requiere auth)
POST   /api/auth/forgot-password       - Solicitar recuperación
POST   /api/auth/reset-password        - Restablecer contraseña

/*
## FLUJO COMPLETO: REGISTRO CON VERIFICACIÓN DE EMAIL

1. Usuario se registra
   ↓
   POST /api/auth/register
   {
     "email": "matias@test.com",
     "name": "Matías",
     "password": "Password123",
     "confirmPassword": "Password123"
   }
   ↓
2. Sistema crea usuario (emailVerified = false)
   ┌────────────────────────────────────────────┐
   │ id: 1                                      │
   │ email: matias@test.com                     │
   │ name: Matías                               │
   │ email_verified: false  ← NO VERIFICADO     │
   │ verified_at: null                          │
   └────────────────────────────────────────────┘
   ↓
3. Sistema genera token de verificación
   ┌────────────────────────────────────────────┐
   │ token: abc123def456...                     │
   │ user_id: 1                                 │
   │ expires_at: +24 horas                      │
   └────────────────────────────────────────────┘
   ↓
4. Sistema envía email con enlace:
   "http://localhost:5173/verify-email?token=abc123def456..."
   ↓
5. Usuario hace click en el enlace
   Frontend extrae el token y hace:
   POST /api/auth/verify-email
   {
     "token": "abc123def456..."
   }
   ↓
6. Sistema verifica:
   ✅ Token existe
   ✅ Token no expirado
   ✅ Token no revocado
   ✅ Usuario no verificado previamente
   ↓
7. Sistema actualiza usuario:
   ┌────────────────────────────────────────────┐
   │ email_verified: true  ← VERIFICADO         │
   │ verified_at: 2025-10-08T16:00:00Z          │
   └────────────────────────────────────────────┘
   ↓
8. Sistema revoca token de verificación
   ↓
9. Sistema envía email de bienvenida
   ↓
10. Usuario puede iniciar sesión normalmente

CASO ESPECIAL: Token expirado
   ↓
   POST /api/auth/resend-verification
   {
     "email": "matias@test.com"
   }
   ↓
   Sistema genera NUEVO token y reenvía email
*/

## Resúmenes y cálculos

- Opcional: endpoints para balance (Transaction.getBalance(userId))
- Resumen por categoría (Transaction.getSummaryByCategory(userId, startDate, endDate))



---------------------------------------------------------------------------------------------------
| Método | Ruta                              | Descripción                                        |
| ------ | --------------------------------- | -------------------------------------------------- |
| POST   | `/api/transactions`               | Crear nueva transacción (ingreso o gasto)          |
| GET    | `/api/transactions`               | Listar todas las transacciones activas del usuario |
| GET    | `/api/transactions/:id`           | Obtener detalle de una transacción específica      |
| PUT    | `/api/transactions/:id`           | Actualizar transacción existente                   |
| DELETE | `/api/transactions/:id`           | Soft delete (marcar como eliminada)                |
| POST   | `/api/transactions/:id/restore`   | Restaurar transacción eliminada                    |
| DELETE | `/api/transactions/:id/permanent` | Eliminar permanentemente (no recomendado)          |
---------------------------------------------------------------------------------------------------

## 🔄 Flujo Completo de Transacciones

/*
FLUJO COMPLETO DE UNA TRANSACCIÓN:

1. Usuario registra un gasto/ingreso desde el frontend
   ↓
2. POST /api/transactions con datos:
   Headers: Authorization: Bearer <JWT>
   Body:
   {
      "amount": 50000,
      "type": "expense",
      "date": "2025-10-08",
      "description": "Compra supermercado",
      "categoryId": 1,
      "tags": ["super", "comida"]
   }
   Proceso:
      + Backend verifica que el usuario esté autenticado (authMiddleware).
      + Valida campos obligatorios (amount, type, date).
      + Crea registro en transactions con isActive=true.
      + Asocia categoryId al ID enviado por el frontend.
   ↓
3. Se guarda en tabla transactions:
   ┌────────────────────────────────────────────┐
   │ id: 1                                      │
   │ user_id: 1                                 │
   │ amount: 50000.00                           │
   │ type: expense                              │
   │ date: 2025-10-08                           │
   │ description: Compra supermercado           │
   │ category_id: 1                             │
   │ tags: ["super","comida"]                   │
   │ is_active: true                            │
   │ deleted_at: null                           │
   │ category_source: manual                    │
   │ created_at: 2025-10-08T15:30:00Z           │
   │ updated_at: 2025-10-08T15:30:00Z           │
   └────────────────────────────────────────────┘
   ↓
4. Usuario ve la transacción en el dashboard
   GET /api/transactions → Lista todas las activas
   Headers: Authorization: Bearer <JWT>
   Proceso:
      + Solo devuelve transacciones con userId del usuario actual y isActive=true.
   ↓
5a. Usuario EDITA la transacción:
    PUT /api/transactions/1
   Headers: Authorization: Bearer <JWT>
   Body:
   {
      "amount": 55000,
      "description": "Compra supermercado (corregido)",
      "tags": ["super","comida","urgente"]
   }
   Proceso:
      + Solo el dueño puede actualizar.
      + updated_at se actualiza automáticamente.
      + categoryId también puede actualizarse si el usuario cambia la categoría.
    
5b. Usuario ELIMINA (soft delete):
    DELETE /api/transactions/1
   Headers: Authorization: Bearer <JWT>
   
   Proceso:
      + Cambia isActive=false y deletedAt=NOW().
      + Ya no aparece en listados normales (GET /api/transactions).
   
   Registro modificado en BD:
   →is_active: false
   →deleted_at: 2025-10-08T16:00:00Z

    
5c. Usuario RESTAURA transacción eliminada:
    POST /api/transactions/1/restore
    Headers: Authorization: Bearer <JWT>
   Proceso:
    → is_active = true
    → deleted_at = null
    → Vuelve a aparecer en listados normales
    
5d. Usuario ELIMINA PERMANENTE:
    DELETE /api/transactions/1/permanent
    Headers: Authorization: Bearer <JWT>

    Proceso:
      + Elimina completamente el registro de la base de datos.

6. Cálculos automáticos:
   ┌──────────────────────────────────────┐
   │ Transaction.getBalance(userId: 1)    │
   │                                      │
   │ Income:  $100,000                    │
   │ Expense:  $50,000                    │
   │ Balance:  $50,000                    │
   └──────────────────────────────────────┘
   
7. Reportes y análisis:
   ┌──────────────────────────────────────────────┐
   │ Transaction.getSummaryByCategory()           │
   │                                              │
   │ Alimentación: $50,000 (15 transacciones)     │
   │ Transporte:   $20,000 (8 transacciones)      │
   │ Salud:        $10,000 (3 transacciones)      │
   └──────────────────────────────────────────────┘

MÉTODOS ÚTILES:

// Verificar tipo
transaction.isIncome()   → false (es expense)
transaction.isExpense()  → true

// Obtener monto con signo (para calcular balance)
transaction.getSignedAmount()  → -50000 (negativo porque es gasto)

// Soft delete
transaction.softDelete()  → is_active=false, deleted_at=NOW()

// Restaurar
transaction.restore()  → is_active=true, deleted_at=null

CONSULTAS COMUNES:

// Solo gastos activos
Transaction.scope('expense').findAll()

// Solo ingresos activos  
Transaction.scope('income').findAll()

// Balance del usuario
const balance = await Transaction.getBalance(userId)

// Transacciones del mes actual
const thisMonth = await Transaction.getCurrentMonth(userId)

// Buscar por descripción
const results = await Transaction.searchByDescription(userId, "super")

// Resumen por categoría
const summary = await Transaction.getSummaryByCategory(userId, startDate, endDate)
*/

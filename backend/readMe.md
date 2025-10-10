
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

# 📚 API STONKYSTONK - GUÍA RÁPIDA PARA FRONTEND

**Base URL:** `http://localhost:3000/api`

**Autenticación:** Todas las rutas requieren header `Authorization: Bearer {token}`

---

## 🏷️ CATEGORÍAS

### **GET /categories**
Obtiene todas las categorías activas del sistema.

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Alimentación",
      "type": "expense",
      "icon": "utensils",
      "color": "#FF6B6B"
    }
  ]
}
```

### **GET /categories/expense**
Solo categorías de gastos.

### **GET /categories/income**
Solo categorías de ingresos.

### **GET /categories/:id**
Detalle de una categoría específica.

---

## 💰 TRANSACCIONES

### **POST /transactions**
Crear nueva transacción.

**Body:**
```json
{
  "amount": 50000,
  "type": "expense",
  "date": "2025-11-05",
  "description": "Compra supermercado",
  "categoryId": 1,
  "tags": ["super", "comida"],
  "categorySource": "auto"
}
```

**Nota:** `categorySource` puede ser: `"manual"`, `"auto"`, o `"corrected"`. Si no se envía, usa `"manual"` por defecto.

### **GET /transactions**
Lista todas las transacciones del usuario.

**Query params opcionales:**
- `categoryId`: Filtrar por categoría
- `type`: `income` o `expense`
- `startDate`: Fecha inicial
- `endDate`: Fecha final
- `search`: Buscar en descripción
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 50)

### **GET /transactions/:id**
Detalle de una transacción.

### **PUT /transactions/:id**
Actualizar transacción. Si se cambia `categoryId`, automáticamente marca como `categorySource: "corrected"`.

### **DELETE /transactions/:id**
Soft delete (marca como inactiva).

### **POST /transactions/:id/restore**
Restaurar transacción eliminada.

### **DELETE /transactions/:id/permanent**
Eliminar permanentemente (no recomendado).

---

## 🤖 SUGERENCIAS DE CATEGORÍAS

### **POST /transactions/suggest-category**
Sugiere una categoría basándose en la descripción.

**Body:**
```json
{
  "description": "Netflix noviembre",
  "type": "expense"
}
```

**Response:**
```json
{
  "suggestedCategoryId": 6,
  "categoryName": "Entretenimiento",
  "categoryIcon": "film",
  "categoryColor": "#DFE6E9",
  "confidence": "high",
  "reason": "keyword"
}
```

**Valores de `confidence`:** `"high"`, `"medium"`, `"low"`

**Valores de `reason`:** `"historial"`, `"keyword"`, `"default"`

---

## 📊 DASHBOARD

### **GET /dashboard/overview**
Resumen completo (recomendado para cargar el dashboard).

**Response:**
```json
{
  "overview": {
    "balance": {
      "totalIncome": 1500000,
      "totalExpense": 800000,
      "currentBalance": 700000
    },
    "currentMonth": {
      "income": 500000,
      "expense": 300000,
      "balance": 200000,
      "transactionCount": 15
    },
    "topCategories": [
      {
        "categoryName": "Alimentación",
        "total": 150000,
        "percentage": 50.00
      }
    ]
  }
}
```

### **GET /dashboard/balance**
Balance general del usuario (total histórico).

### **GET /dashboard/current-month**
Resumen solo del mes actual.

### **GET /dashboard/by-category**
Gastos agrupados por categoría.

**Query params opcionales:**
- `startDate`: Fecha inicial
- `endDate`: Fecha final

**Response:**
```json
{
  "categories": [
    {
      "categoryName": "Alimentación",
      "total": 150000,
      "count": 8,
      "percentage": 50.00
    }
  ]
}
```

### **GET /dashboard/monthly-trend**
Tendencia de los últimos N meses.

**Query params opcionales:**
- `months`: Número de meses (default: 6, máx: 12)

**Response:**
```json
{
  "trend": [
    {
      "year": 2025,
      "month": 10,
      "monthName": "octubre",
      "income": 500000,
      "expense": 300000,
      "balance": 200000,
      "transactionCount": 15
    }
  ]
}
```

---

## 🎯 FLUJO RECOMENDADO

### **Al cargar la app:**
1. `GET /dashboard/overview` → Mostrar resumen general
2. `GET /categories` → Cargar opciones de categorías // ¿?

### **Al registrar transacción:**
1. Usuario llena formulario
2. Usuario hace clic en "Sugerir Categoría"
3. `POST /transactions/suggest-category` → Obtener sugerencia
4. Mostrar categoría sugerida en el formulario
5. Usuario puede aceptar o cambiar
6. `POST /transactions` con `categorySource` apropiado

### **Al cargar gráficos:**
- `GET /dashboard/by-category` → Para gráfico de torta/dona
- `GET /dashboard/monthly-trend?months=6` → Para gráfico de líneas

---

## 💡 TIPS PARA EL FRONTEND

### **Manejo de `categorySource`:**
- Usuario selecciona manualmente → `"manual"`
- Usuario acepta sugerencia → `"auto"`
- Usuario cambia sugerencia → `"corrected"`
- Usuario edita transacción existente → Backend marca como `"corrected"` automáticamente

### **Paginación:**
```javascript
// Página 1
GET /transactions?page=1&limit=20

// Página 2
GET /transactions?page=2&limit=20
```

### **Filtros combinados:**
```javascript
GET /transactions?type=expense&categoryId=1&startDate=2025-10-01&endDate=2025-10-31
```

### **Búsqueda:**
```javascript
GET /transactions?search=netflix
```

---

## 🌱 DESARROLLO (SOLO DEV)

### **POST /seed/transactions**
Crea transacciones de prueba (últimos 3 meses).

**Nota:** Solo disponible en `NODE_ENV=development`.

### **DELETE /seed/transactions**
Elimina transacciones de prueba.

---

## ❌ CÓDIGOS DE ERROR COMUNES

- `400` - Validación fallida o datos inválidos
- `401` - Token no válido o expirado
- `403` - Email no verificado (algunas rutas)
- `404` - Recurso no encontrado
- `500` - Error del servidor

---

## 📞 CONTACTO

Si hay dudas sobre algún endpoint o necesitas algo adicional, coordinar con el equipo de backend.

**Última actualización:** 05-Nov-2025

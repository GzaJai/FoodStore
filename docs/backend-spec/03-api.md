# FoodStore Backend — API REST

## Base URL
```
http://localhost:3000/api
```

---

## 1. AUTH

### POST `/auth/login`
Iniciar sesión.

**Body:**
```json
{
  "email": "admin@foodstore.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@foodstore.com",
      "phone": "+54 9 11 1234-5678",
      "role": "ADMIN"
    }
  }
}
```

**Response 401:**
```json
{ "success": false, "error": { "message": "Credenciales inválidas", "code": "INVALID_CREDENTIALS" } }
```

---

### POST `/auth/logout`
Invalidar sesión (opcional si JWT stateless).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{ "success": true, "message": "Sesión cerrada" }
```

---

### GET `/auth/me`
Obtener datos del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@foodstore.com",
    "phone": "+54 9 11 1234-5678",
    "role": "ADMIN",
    "avatar": null,
    "lastLoginAt": "2025-05-21T15:30:00Z"
  }
}
```

---

## 2. USERS / PERFIL

### GET `/users/me`
Mismo que `/auth/me` (alternativa).

### PATCH `/users/me`
Actualizar perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Nuevo Nombre",
  "phone": "+54 9 11 9999-8888"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nuevo Nombre",
    "email": "admin@foodstore.com",
    "phone": "+54 9 11 9999-8888",
    "role": "ADMIN"
  }
}
```

### PATCH `/users/me/password`
Cambiar contraseña.

**Body:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "nueva123"
}
```

**Response 200:**
```json
{ "success": true, "message": "Contraseña actualizada" }
```

**Response 400:**
```json
{ "success": false, "error": { "message": "Contraseña actual incorrecta", "code": "WRONG_PASSWORD" } }
```

---

## 3. PEDIDOS (ORDERS)

### GET `/orders`
Listar pedidos con filtros y paginación.

**Query params:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `status` | string | - | Filtrar por estado |
| `channel` | string | - | Filtrar por canal |
| `search` | string | - | Buscar por cliente, número o items |
| `date` | string | hoy | Fecha en formato YYYY-MM-DD |
| `page` | number | 1 | Página |
| `perPage` | number | 50 | Por página |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 99,
      "orderNumber": "FS-20250521-099",
      "customerName": "mayra galarza",
      "customerPhone": null,
      "status": "PENDING",
      "channel": "DELIVERY",
      "priority": false,
      "notes": null,
      "total": 5500.00,
      "createdAt": "2025-05-21T20:56:00Z",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "name": "Hamburguesa Clásica",
          "quantity": 1,
          "unitPrice": 5500.00,
          "extras": []
        }
      ]
    }
  ],
  "meta": { "page": 1, "total": 99, "perPage": 50 }
}
```

### GET `/orders/:id`
Obtener detalle de un pedido.

**Response 200:** Pedido completo con items.

### POST `/orders`
Crear nuevo pedido.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "customerName": "Juan Perez",
  "customerPhone": "+54 9 11 5555-4444",
  "channel": "TABLE",
  "tableNumber": 5,
  "priority": false,
  "notes": "Sin cebolla",
  "items": [
    {
      "productId": "uuid-del-producto",
      "quantity": 2,
      "extras": ["Extra queso"]
    },
    {
      "productId": "uuid-otro-producto",
      "quantity": 1,
      "extras": []
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "orderNumber": "FS-20250521-100",
    "customerName": "Juan Perez",
    "status": "PENDING",
    "channel": "TABLE",
    "total": 13500.00,
    "createdAt": "2025-05-21T21:00:00Z",
    "items": [...]
  }
}
```

### PATCH `/orders/:id/status`
Cambiar estado de un pedido.

**Body:**
```json
{
  "status": "PREPARING"
}
```

**Reglas de transición:**
```
PENDING → PREPARING, CANCELLED
PREPARING → READY, CANCELLED
READY → SENT, CANCELLED
SENT → BILLED
BILLED → (terminal)
CANCELLED → (terminal)
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 99,
    "status": "PREPARING",
    "updatedAt": "2025-05-21T21:05:00Z"
  }
}
```

**Response 400:**
```json
{ "success": false, "error": { "message": "Transición de estado no válida: PENDING → BILLED", "code": "INVALID_TRANSITION" } }
```

### DELETE `/orders/:id`
Cancelar pedido (soft delete → status CANCELLED).

---

## 4. PRODUCTOS

### GET `/products`
Listar productos activos.

**Query params:** `category`, `search`, `active`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hamburguesa Clásica",
      "description": "Carne 180g, lechuga, tomate, queso",
      "price": 5500.00,
      "category": "ALMUERZOS",
      "isActive": true,
      "image": null,
      "prepTimeMin": 15
    }
  ]
}
```

### POST `/products`
Crear producto. **Requiere rol: ADMIN o MANAGER**

**Body:**
```json
{
  "name": "Hamburguesa Clásica",
  "description": "Carne 180g...",
  "price": 5500,
  "category": "ALMUERZOS",
  "prepTimeMin": 15
}
```

### PATCH `/products/:id`
Actualizar producto. **Requiere rol: ADMIN o MANAGER**

### DELETE `/products/:id`
Desactivar producto (soft delete). **Requiere rol: ADMIN o MANAGER**

---

## 5. CATEGORÍAS DE CLIENTES

### GET `/categories/client`
Listar categorías de clientes.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "key": "delivery",
      "name": "DELIVERY",
      "icon": "Bike",
      "logo": "https://...",
      "color": "#3b82f6",
      "isActive": true,
      "sortOrder": 1,
      "clientCount": 45
    }
  ]
}
```

### POST `/categories/client`
Crear categoría. **Requiere rol: ADMIN**

**Body:**
```json
{
  "key": "vip",
  "name": "VIP",
  "icon": "Star",
  "color": "#f59e0b"
}
```

### PATCH `/categories/client/:id`
Actualizar categoría.

### POST `/categories/client/:id/logo`
Subir logo para la categoría. **multipart/form-data**

---

## 6. CLIENTES

### GET `/clients`
Listar clientes.

**Query params:** `categoryId`, `search`, `affiliated`

### POST `/clients`
Crear cliente.

### PATCH `/clients/:id`
Actualizar cliente.

---

## 7. DASHBOARD

### GET `/dashboard/metrics`
Obtener métricas del dashboard para una fecha.

**Query params:** `date` (YYYY-MM-DD, default: hoy)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "date": "2025-05-21",
    "totalSales": 43570.00,
    "totalOrders": 7,
    "deliveredOrders": 60,
    "takeawayCount": 2,
    "deliveryCount": 4,
    "categoryBreakdown": [
      { "name": "Almuerzos", "value": 25, "color": "#f97316" },
      { "name": "Sandwiches", "value": 15.6, "color": "#3b82f6" },
      { "name": "Pizzas", "value": 8.3, "color": "#8b5cf6" },
      { "name": "Desayunos", "value": 8.3, "color": "#10b981" },
      { "name": "Otros", "value": 42.8, "color": "#6b7280" }
    ],
    "previousDay": {
      "totalSales": 47500.00,
      "totalOrders": 6,
      "salesChange": -8.4,
      "ordersChange": 14.2
    }
  }
}
```

### GET `/dashboard/open-orders`
Pedidos abiertos (pending, preparing, ready).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 99,
      "customerName": "mayra galarza",
      "status": "PENDING",
      "channel": "DELIVERY",
      "total": 5500.00,
      "createdAt": "2025-05-21T20:56:00Z",
      "items": [...]
    }
  ]
}
```

---

## 8. REPORTES

### GET `/reports/export`
Exportar datos.

**Query params:** `type` (orders, sales, products), `from`, `to`, `format` (csv, xlsx)

**Response 200:** Archivo descargable.

---

## Resumen de Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| POST | `/auth/login` | No | - | Login |
| POST | `/auth/logout` | Sí | - | Logout |
| GET | `/auth/me` | Sí | - | Info usuario |
| PATCH | `/users/me` | Sí | - | Actualizar perfil |
| PATCH | `/users/me/password` | Sí | - | Cambiar contraseña |
| GET | `/orders` | Sí | - | Listar pedidos |
| GET | `/orders/:id` | Sí | - | Detalle pedido |
| POST | `/orders` | Sí | - | Crear pedido |
| PATCH | `/orders/:id/status` | Sí | - | Cambiar estado |
| DELETE | `/orders/:id` | Sí | admin/manager | Cancelar pedido |
| GET | `/products` | Sí | - | Listar productos |
| POST | `/products` | Sí | admin/manager | Crear producto |
| PATCH | `/products/:id` | Sí | admin/manager | Editar producto |
| DELETE | `/products/:id` | Sí | admin/manager | Desactivar producto |
| GET | `/categories/client` | Sí | - | Categorías clientes |
| POST | `/categories/client` | Sí | admin | Crear categoría |
| PATCH | `/categories/client/:id` | Sí | admin | Editar categoría |
| POST | `/categories/client/:id/logo` | Sí | admin | Subir logo |
| GET | `/clients` | Sí | - | Listar clientes |
| POST | `/clients` | Sí | - | Crear cliente |
| PATCH | `/clients/:id` | Sí | - | Editar cliente |
| GET | `/dashboard/metrics` | Sí | - | Métricas |
| GET | `/dashboard/open-orders` | Sí | - | Pedidos abiertos |
| GET | `/reports/export` | Sí | admin/manager | Exportar datos |

# FoodStore Backend — Especificación General

## Stack Recomendado

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Runtime | **Node.js 20+** | Mismo ecosistema que el frontend, WebSockets nativos |
| Framework | **Express** o **Fastify** | Express: simple y probado. Fastify: más performante |
| Base de datos | **PostgreSQL 16+** | Relacional, JSONB para items de pedido, robusto |
| ORM | **Prisma** | Type-safe, migraciones, excelente DX |
| Auth | **JWT** (jsonwebtoken) | Stateless, fácil de integrar con frontend |
| Real-time | **Socket.io** | WebSockets con fallback, rooms por canal |
| Validación | **Zod** | Ya usada en el frontend, reutilizable |
| Testing | **Vitest + Supertest** | Rápido, consistente con el stack |

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│  Login → Dashboard → Pedidos → KDS → Clientes   │
└──────────────────────┬──────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────────┐
│              API Gateway (Express)               │
│  ├── /api/auth          (autenticación)          │
│  ├── /api/users         (usuarios/perfil)        │
│  ├── /api/orders        (pedidos CRUD)           │
│  ├── /api/products      (productos)              │
│  ├── /api/categories    (categorías clientes)    │
│  ├── /api/dashboard     (métricas)               │
│  └── /api/reports       (exportar datos)         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              PostgreSQL Database                 │
│  users, orders, order_items, products,           │
│  categories, client_categories, audit_logs       │
└──────────────────────────────────────────────────┘
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   ├── config/
│   │   ├── database.ts          # Prisma client
│   │   └── env.ts               # Validación de env vars con Zod
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.middleware.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.routes.ts
│   │   ├── orders/
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   └── orders.routes.ts
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.routes.ts
│   │   ├── categories/
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── categories.routes.ts
│   │   └── dashboard/
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.routes.ts
│   ├── middleware/
│   │   ├── auth.ts              # JWT verify
│   │   ├── errorHandler.ts      # Error handler global
│   │   └── validate.ts          # Zod validator middleware
│   ├── lib/
│   │   └── socket.ts            # Socket.io setup
│   └── utils/
│       └── logger.ts
├── prisma/
│   ├── schema.prisma            # Modelo de datos
│   └── seed.ts                  # Datos iniciales
├── package.json
└── .env.example
```

## Variables de Entorno

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foodstore?schema=public"

# JWT
JWT_SECRET="tu-secret-key-cambiar-en-produccion"
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN="http://localhost:5173"
```

## Convenciones de API

### Respuestas

```typescript
// Éxito (200/201)
{ "success": true, "data": { ... } }

// Paginación
{ "success": true, "data": [...], "meta": { "page": 1, "total": 50, "perPage": 20 } }

// Error (400/401/404/500)
{ "success": false, "error": { "message": "...", "code": "VALIDATION_ERROR" } }
```

### Autenticación

- Header: `Authorization: Bearer <token>`
- El token JWT contiene: `{ sub: userId, email, role, iat, exp }`
- Middleware `requireAuth` valida el token en rutas protegidas
- Middleware `requireRole('admin')` para rutas administrativas

### Estados de Pedido (máquina de estados)

```
pending → preparing → ready → sent → billed
  ↓
cancelled (desde cualquier estado)
```

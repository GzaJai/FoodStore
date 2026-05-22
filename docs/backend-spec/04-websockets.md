# FoodStore Backend — WebSockets (Tiempo Real)

## Configuración

Socket.io montado en el mismo servidor Express.

```typescript
import { Server } from 'socket.io'

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN },
})
```

## Autenticación en WebSocket

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  // Validar JWT
  const user = verifyToken(token)
  if (!user) return next(new Error('Unauthorized'))
  socket.data.user = user
  next()
})
```

## Rooms (Salas)

| Room | Quién entra | Para qué |
|------|-------------|----------|
| `orders` | Todos los autenticados | Todos los cambios de pedidos |
| `kitchen` | COOK, ADMIN, MANAGER | Solo eventos de cocina |
| `dashboard` | ADMIN, MANAGER | Métricas en tiempo real |
| `user:{id}` | Usuario específico | Notificaciones personales |

## Eventos del Servidor → Cliente

### Pedidos

```typescript
// Nuevo pedido creado
socket.emit('order:created', {
  id: 100,
  orderNumber: 'FS-20250521-100',
  customerName: 'Juan Perez',
  status: 'PENDING',
  channel: 'TABLE',
  items: [...],
  total: 13500.00,
  createdAt: '2025-05-21T21:00:00Z',
})

// Cambio de estado
socket.emit('order:statusChanged', {
  id: 99,
  oldStatus: 'PENDING',
  newStatus: 'PREPARING',
  updatedAt: '2025-05-21T21:05:00Z',
})

// Pedido cancelado
socket.emit('order:cancelled', {
  id: 86,
  reason: 'Cliente desistió',
  cancelledAt: '2025-05-21T21:10:00Z',
})
```

### Dashboard

```typescript
// Métricas actualizadas (cada 30s o al cambiar un pedido)
socket.emit('dashboard:metricsUpdated', {
  date: '2025-05-21',
  totalSales: 43570.00,
  totalOrders: 7,
  deliveredOrders: 60,
})

// Pedido abierto actualizado
socket.emit('dashboard:openOrdersUpdated', {
  orders: [...], // Lista completa actualizada
})
```

### Notificaciones

```typescript
// Pedido prioritario
socket.to('kitchen').emit('notification', {
  type: 'priority_order',
  message: 'Nuevo pedido prioritario #101',
  orderId: 101,
  timestamp: '2025-05-21T21:15:00Z',
})

// Pedido demorado (>30 min en cocina)
socket.to('kitchen').emit('notification', {
  type: 'delayed_order',
  message: 'Pedido #95 lleva 30 min en preparación',
  orderId: 95,
  elapsedMinutes: 30,
})
```

## Eventos del Cliente → Servidor

```typescript
// Suscribirse a rooms
socket.emit('subscribe', { rooms: ['kitchen', 'dashboard'] })

// Marcar pedido como terminado (desde KDS)
socket.emit('order:complete', {
  orderId: 99,
})
// El servidor valida, cambia estado a READY, y emite 'order:statusChanged' a todos

// Heartbeat
socket.emit('ping')
socket.on('pong', () => { /* conexión activa */ })
```

## Flujo Típico: Pedido en Tiempo Real

```
[Frontend POS] ──POST /orders──→ [Backend]
                                     │
                                     ├── Crea pedido en DB
                                     ├── Emite 'order:created' → room:orders
                                     ├── Emite 'order:created' → room:kitchen
                                     └── Emite 'dashboard:metricsUpdated' → room:dashboard

[Frontend KDS] ←── order:created ───┘
  (muestra nueva tarjeta)

[Frontend Dashboard] ←── order:created ───┘
  (actualiza pedidos abiertos)

[Cocinero] ──click "Preparar"──→ [Frontend KDS]
                                    │
                                    └── socket.emit('order:complete', { orderId: 99 })
                                         │
                                         ▼
                                    [Backend]
                                      ├── Valida transición PENDING → PREPARING
                                      ├── Actualiza DB
                                      └── Emite 'order:statusChanged' → room:orders

[Frontend Dashboard] ←── order:statusChanged ───┘
  (mueve tarjeta de columna)
```

## Reconexión

```typescript
// Cliente se reconecta
socket.on('connect', () => {
  // Solicitar estado actual
  socket.emit('sync:request')
})

// Servidor responde con estado completo
socket.on('sync:request', () => {
  socket.emit('sync:orders', { orders: currentOrders })
  socket.emit('sync:metrics', { metrics: currentMetrics })
})
```

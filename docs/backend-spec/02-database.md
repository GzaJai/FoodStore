# FoodStore Backend — Modelo de Datos (Prisma)

## Schema Completo

```prisma
// ==========================================
// CONFIGURACIÓN
// ==========================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ENUMS
// ==========================================
enum UserRole {
  ADMIN
  MANAGER
  COOK
  CASHIER
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  SENT
  BILLED
  CANCELLED
}

enum OrderChannel {
  DELIVERY
  TABLE
  TAKEAWAY
}

enum ProductCategory {
  ALMUERZOS
  SANDWICHES
  PIZZAS
  DESAYUNOS
  BEBIDAS
  POSTRES
  ENTRADAS
  OTROS
}

// ==========================================
// MODELOS
// ==========================================

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  phone         String?
  passwordHash  String    // bcrypt
  role          UserRole  @default(CASHIER)
  avatar        String?   // URL
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  ordersCreated Order[]   @relation("OrderCreator")
  auditLogs     AuditLog[]

  @@index([email])
  @@index([role])
}

model Order {
  id              Int          @id @default(autoincrement())
  orderNumber     String       @unique  // Formato: "FS-20250521-001"
  customerName    String
  customerPhone   String?
  customerEmail   String?
  tableNumber     Int?         // Solo para channel=TABLE
  status          OrderStatus  @default(PENDING)
  channel         OrderChannel
  priority        Boolean      @default(false)
  notes           String?      // Instrucciones especiales
  subtotal        Decimal      @default(0) @db.Decimal(10, 2)
  tax             Decimal      @default(0) @db.Decimal(10, 2)
  total           Decimal      @db.Decimal(10, 2)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  preparedAt      DateTime?    // Cuando pasa a READY
  sentAt          DateTime?    // Cuando pasa a SENT
  billedAt        DateTime?    // Cuando pasa a BILLED
  cancelledAt     DateTime?
  cancelReason    String?

  items           OrderItem[]
  createdBy       User?        @relation("OrderCreator", fields: [createdById], references: [id])
  createdById     String?

  @@index([status])
  @@index([channel])
  @@index([createdAt])
  @@index([orderNumber])
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   Int
  productId String
  name      String  // Snapshot del nombre al momento de crear
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
  extras    String[] // Array de strings: ["Sin cebolla", "Extra queso"]
  notes     String?

  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model Product {
  id          String           @id @default(uuid())
  name        String
  description String?
  price       Decimal          @db.Decimal(10, 2)
  category    ProductCategory
  isActive    Boolean          @default(true)
  image       String?          // URL
  prepTimeMin Int?             // Tiempo estimado de preparación
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  orderItems  OrderItem[]

  @@index([category])
  @@index([isActive])
}

model ClientCategory {
  id        String   @id @default(uuid())
  key       String   @unique  // "delivery", "tables", "dine-in", etc.
  name      String   // "DELIVERY", "MESAS", "DINE IN"
  icon      String?  // Nombre del icono (lucide)
  logo      String?  // URL del logo subido
  color     String?  // Color hex
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  clients   Client[]

  @@index([key])
}

model Client {
  id              String   @id @default(uuid())
  name            String
  email           String?
  phone           String?
  address         String?
  isAffiliated    Boolean  @default(false)
  clientCategoryId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        ClientCategory? @relation(fields: [clientCategoryId], references: [id])

  @@index([clientCategoryId])
  @@index([email])
  @@index([phone])
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // "ORDER_CREATED", "STATUS_CHANGED", "USER_LOGIN", etc.
  entity    String   // "order", "user", "product"
  entityId  String?
  details   Json?    // Datos del cambio
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entity])
  @@index([createdAt])
}

model DashboardMetric {
  id        String   @id @default(uuid())
  date      DateTime @db.Date  // Fecha del día
  totalSales Decimal @db.Decimal(12, 2)
  totalOrders Int
  deliveredOrders Int
  takeawayCount Int
  deliveryCount Int
  categoryBreakdown Json?  // [{name, value, percentage}]
  previousDaySales Decimal? @db.Decimal(12, 2)
  previousDayOrders Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([date])
  @@index([date])
}
```

## Relaciones

```
User 1 ─── N Order (creador)
Order 1 ─── N OrderItem
Product 1 ─── N OrderItem
ClientCategory 1 ─── N Client
User 1 ─── N AuditLog
```

## Datos de Seed (iniciales)

```typescript
// Usuarios
- admin@foodstore.com / admin123 (ADMIN)
- cocina@foodstore.com / cocina123 (COOK)
- caja@foodstore.com / caja123 (CASHIER)
- gerente@foodstore.com / gerente123 (MANAGER)

// Categorías de cliente
- TODOS, NO AFILIADO, DELIVERY, MESAS, DINE IN, TAKE AWAY, DOMICILIO FIJO

// Productos (ejemplo)
- Hamburguesa Clásica ($5500, ALMUERZOS)
- Pizza Mozzarella ($7000, PIZZAS)
- Faina ($2500, OTROS)
- Milanesa Napolitana ($8000, ALMUERZOS)
- Empanadas x6 ($4500, ENTRADAS)
- Ensalada César ($5000, ALMUERZOS)
- Pasta Bolognesa ($6500, ALMUERZOS)
- Coca Cola ($2000, BEBIDAS)
- Café Latte Grande ($3000, DESAYUNOS)
- Tostado Jamón y Queso ($3500, SANDWICHES)
```

# FoodStore Backend — Guía de Implementación

## Paso a Paso

### 1. Inicializar Proyecto

```bash
mkdir backend && cd backend
npm init -y
npm install express cors helmet express-rate-limit bcrypt jsonwebtoken socket.io zod
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken tsx prisma
npx tsc --init
npx prisma init
```

### 2. Configurar Prisma

Copiar el schema de `02-database.md` a `prisma/schema.prisma`.

```bash
# Crear migración
npx prisma migrate dev --name init

# Generar cliente
npx prisma generate

# Seed inicial
npx prisma db seed
```

### 3. Estructura de Carpetas

```
backend/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── categories/
│   │   └── dashboard/
│   ├── middleware/
│   ├── lib/
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── package.json
├── tsconfig.json
└── .env
```

### 4. Orden de Implementación Recomendado

| Orden | Módulo | Tiempo est. | Dependencias |
|-------|--------|-------------|--------------|
| 1 | **Config + DB** | 1h | Prisma, .env |
| 2 | **Auth** | 2h | bcrypt, JWT |
| 3 | **Users/Perfil** | 1h | Auth |
| 4 | **Products** | 2h | Auth |
| 5 | **Orders** | 3h | Auth, Products |
| 6 | **Categories** | 1.5h | Auth |
| 7 | **Clients** | 1h | Auth, Categories |
| 8 | **Dashboard** | 2h | Auth, Orders |
| 9 | **WebSockets** | 2h | Orders, Dashboard |
| 10 | **Reports** | 1.5h | Auth |
| 11 | **Tests** | 3h | Todo lo anterior |

### 5. Integración con Frontend

Una vez el backend esté corriendo en `http://localhost:3000`:

1. Crear archivo `src/api/client.ts` en el frontend
2. Reemplazar los datos mock de los stores con llamadas reales
3. Agregar interceptor de auth para incluir JWT en cada request
4. Conectar Socket.io para eventos en tiempo real

```typescript
// src/api/client.ts (ejemplo)
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

// Interceptor de auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de errores
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export { api }
```

### 6. Scripts de package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "test": "vitest"
  }
}
```

### 7. Dependencias del Frontend para Conectar

```bash
cd frontend/FoodStore
npm install axios socket.io-client
npm install -D @types/axios  # si es necesario
```

## Checklist de Funcionalidades

- [ ] Login con JWT funciona
- [ ] Logout invalida sesión
- [ ] Perfil se puede actualizar
- [ ] Cambio de contraseña funciona
- [ ] CRUD de pedidos completo
- [ ] Máquina de estados de pedidos funciona
- [ ] Búsqueda y filtros de pedidos
- [ ] CRUD de productos
- [ ] Categorías de clientes con logos
- [ ] Métricas del dashboard calculan bien
- [ ] WebSockets emiten eventos en tiempo real
- [ ] KDS recibe pedidos nuevos al instante
- [ ] Dashboard se actualiza en tiempo real
- [ ] Rate limiting en login funciona
- [ ] CORS configurado correctamente
- [ ] Audit logs registran acciones
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan

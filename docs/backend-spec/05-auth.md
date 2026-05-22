# FoodStore Backend — Autenticación y Autorización

## Autenticación (JWT)

### Flujo de Login

```
Cliente                          Servidor
  │                                │
  │  POST /auth/login              │
  │  { email, password } ────────→ │
  │                                │  1. Buscar usuario por email
  │                                │  2. Verificar password con bcrypt
  │                                │  3. Generar JWT
  │                                │  4. Actualizar lastLoginAt
  │                                │
  │  ←── { token, user } ───────── │
  │                                │
  │  Almacena token (localStorage) │
```

### Token JWT

```json
{
  "sub": "user-uuid",
  "email": "admin@foodstore.com",
  "role": "ADMIN",
  "iat": 1716321600,
  "exp": 1716926400
}
```

- **Algoritmo**: HS256
- **Expiración**: 7 días (configurable)
- **Secret**: variable de entorno `JWT_SECRET`

### Middleware de Auth

```typescript
// middleware/auth.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token requerido', code: 'NO_TOKEN' }
    })
  }

  try {
    const token = header.split(' ')[1]
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: 'Token inválido o expirado', code: 'INVALID_TOKEN' }
    })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'No tienes permisos', code: 'FORBIDDEN' }
      })
    }
    next()
  }
}
```

## Autorización por Rol

| Endpoint | ADMIN | MANAGER | COOK | CASHIER |
|----------|-------|---------|------|---------|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ |
| `GET /orders` | ✅ | ✅ | ✅ | ✅ |
| `POST /orders` | ✅ | ✅ | ❌ | ✅ |
| `PATCH /orders/:id/status` | ✅ | ✅ | ✅ | ✅ |
| `DELETE /orders/:id` | ✅ | ✅ | ❌ | ❌ |
| `GET /products` | ✅ | ✅ | ✅ | ✅ |
| `POST /products` | ✅ | ✅ | ❌ | ❌ |
| `PATCH /products/:id` | ✅ | ✅ | ❌ | ❌ |
| `DELETE /products/:id` | ✅ | ✅ | ❌ | ❌ |
| `GET /categories/client` | ✅ | ✅ | ✅ | ✅ |
| `POST /categories/client` | ✅ | ❌ | ❌ | ❌ |
| `PATCH /categories/client/:id` | ✅ | ❌ | ❌ | ❌ |
| `POST /categories/client/:id/logo` | ✅ | ❌ | ❌ | ❌ |
| `GET /clients` | ✅ | ✅ | ✅ | ✅ |
| `POST /clients` | ✅ | ✅ | ❌ | ✅ |
| `GET /dashboard/metrics` | ✅ | ✅ | ❌ | ❌ |
| `GET /dashboard/open-orders` | ✅ | ✅ | ✅ | ✅ |
| `GET /reports/export` | ✅ | ✅ | ❌ | ❌ |

## Hash de Contraseñas

```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

## Protección contra Brute Force

```typescript
// Rate limiting en login
import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    success: false,
    error: {
      message: 'Demasiados intentos. Esperá 15 minutos.',
      code: 'RATE_LIMITED'
    }
  },
  keyGenerator: (req) => req.body.email || req.ip,
})

// Uso: app.post('/auth/login', loginLimiter, authController.login)
```

## CORS

```typescript
import cors from 'cors'

app.use(cors({
  origin: process.env.CORS_ORIGIN, // http://localhost:5173
  credentials: false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
```

## Seguridad General

1. **Helmet**: Headers de seguridad HTTP
2. **express-rate-limit**: Rate limiting general
3. **express-validator / Zod**: Validación de inputs
4. **helmet**: Security headers
5. **hpp**: Protección contra HTTP Parameter Pollution
6. **bcrypt**: Hash de contraseñas (no MD5, no SHA1)
7. **JWT expiración corta**: 7 días, con refresh token opcional
8. **No exponer passwordHash**: Nunca incluir en respuestas JSON
9. **Audit logs**: Registrar logins, cambios de estado, modificaciones

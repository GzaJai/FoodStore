import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { Loader2 } from 'lucide-react'

const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['dashboard', 'pedidos', 'cocina', 'productos', 'categorias', 'ingredientes', 'clientes', 'perfil'],
  manager: ['dashboard', 'pedidos', 'productos', 'clientes', 'perfil'],
  cook: ['cocina', 'perfil'],
  cashier: ['pedidos', 'perfil'],
}

function getDefaultRoute(role?: string): string {
  const routes = ROLE_ROUTES[role ?? '']
  return routes?.[0] ?? 'perfil'
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, _isHydrated, checkAuth } = useAuthStore()
  const location = useLocation()
  const [localHydrated, setLocalHydrated] = useState(_isHydrated)

  useEffect(() => {
    if (!_isHydrated) {
      checkAuth().finally(() => setLocalHydrated(true))
    } else {
      setLocalHydrated(true)
    }
  }, [_isHydrated, checkAuth])

  if (!localHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-orange-500" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/negocio/login" state={{ from: location }} replace />
  }

  const currentPath = location.pathname.replace(/^\/negocio\//, '')
  const allowed = ROLE_ROUTES[user?.role ?? ''] ?? ['perfil']

  if (currentPath && !allowed.includes(currentPath)) {
    const firstAllowed = allowed[0]
    return <Navigate to={`/negocio/${firstAllowed}`} replace />
  }

  return <>{children}</>
}

export function DefaultRoute() {
  const { user } = useAuthStore()
  return <Navigate to={`/negocio/${getDefaultRoute(user?.role)}`} replace />
}

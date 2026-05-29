import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { useUIStore } from '../../../stores/uiStore'
import { Button, Avatar } from '../ui'
import {
  LayoutDashboard,
  ClipboardList,
  Monitor,
  Package,
  Tag,
  Users,
  LogOut,
  UserCircle,
  FlaskConical,
  Truck,
} from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { wsStatus } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'
  const isDelivery = user?.role === 'delivery'

  const navItems = [
    ...(isDelivery
      ? [{ path: '/negocio/reparto', label: 'Reparto', icon: Truck }]
      : [
          { path: '/negocio/dashboard', label: 'Inicio', icon: LayoutDashboard },
          { path: '/negocio/pedidos', label: 'Pedidos', icon: ClipboardList },
          { path: '/negocio/cocina', label: 'Cocina', icon: Monitor },
          ...(isAdminOrManager
            ? [
                { path: '/negocio/productos', label: 'Productos', icon: Package },
                { path: '/negocio/categorias', label: 'Categorías', icon: Tag },
                { path: '/negocio/ingredientes', label: 'Ingredientes', icon: FlaskConical },
              ]
            : []),
          { path: '/negocio/clientes', label: 'Clientes', icon: Users },
        ]),
  ]

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/negocio/login', { replace: true })
  }

  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/negocio/dashboard')}
            className="flex items-center gap-2 text-xl font-bold hover:opacity-90 transition-opacity"
          >
            <span className="bg-white/20 p-1.5 rounded-lg">
              <LayoutDashboard size={20} />
            </span>
            FoodStore
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`px-3 py-2 text-sm ${
                    active ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => navigate(item.path)}
                  leftIcon={<Icon size={16} />}
                >
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20">
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'connected'
                ? 'bg-green-400'
                : wsStatus === 'connecting'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-red-400'
            }`}
          />
          <span className="text-white/80">
            {wsStatus === 'connected' ? 'En vivo' : wsStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/20 gap-2"
            onClick={() => navigate('/negocio/perfil')}
            leftIcon={user ? <Avatar name={user.name} size="sm" /> : <UserCircle size={20} />}
          >
            <span className="text-sm hidden sm:inline">{user?.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white/80 hover:text-white hover:bg-white/20"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  )
}

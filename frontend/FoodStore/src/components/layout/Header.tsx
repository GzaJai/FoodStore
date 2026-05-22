import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { Button, Avatar } from '../ui'
import {
  LayoutDashboard,
  ClipboardList,
  Monitor,
  Users,
  LogOut,
  UserCircle,
} from 'lucide-react'

export default function Header() {
  const { currentView, setCurrentView } = useUIStore()
  const { user, logout } = useAuthStore()

  const navItems = [
    { id: 'dashboard' as const, label: 'Inicio', icon: LayoutDashboard },
    { id: 'orders' as const, label: 'Pedidos', icon: ClipboardList },
    { id: 'kds' as const, label: 'Cocina', icon: Monitor },
    { id: 'client-logos' as const, label: 'Clientes', icon: Users },
  ]

  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo y navegación */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentView('dashboard')}
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
              const isActive = currentView === item.id
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`px-3 py-2 text-sm ${
                    isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setCurrentView(item.id)}
                  leftIcon={<Icon size={16} />}
                >
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/20 gap-2"
            onClick={() => setCurrentView('profile')}
            leftIcon={user ? <Avatar name={user.name} size="sm" /> : <UserCircle size={20} />}
          >
            <span className="text-sm hidden sm:inline">{user?.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
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

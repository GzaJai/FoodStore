import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Button, Input } from '../shared/ui'
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react'

function getDefaultRoute(role?: string): string {
  switch (role) {
    case 'admin':
    case 'manager':
      return '/negocio/dashboard'
    case 'cook':
      return '/negocio/cocina'
    case 'cashier':
      return '/negocio/pedidos'
    default:
      return '/negocio/dashboard'
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor completá todos los campos')
      return
    }

    const success = await login(email, password)
    if (success) {
      const user = useAuthStore.getState().user
      const to = from?.pathname ?? getDefaultRoute(user?.role)
      navigate(to, { replace: true })
    } else {
      setError('Credenciales inválidas')
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🍽️</div>
          <div className="absolute bottom-20 left-20 text-6xl">🥘</div>
          <div className="absolute top-40 right-10 text-7xl">🍕</div>
          <div className="absolute bottom-10 right-20 text-5xl">☕</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">🥗</div>
        </div>
        <div className="flex flex-col items-center justify-center w-full text-white z-10">
          <h1 className="text-5xl font-bold mb-4">FoodStore</h1>
          <p className="text-xl text-white/80">Sistema de Gestión Gastronómica</p>
          <div className="mt-8 px-6 py-3 bg-white/20 rounded-full text-sm backdrop-blur-sm">
            Unified Platform v2.0
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-orange-500" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Bienvenido</h2>
              <p className="text-gray-500 mt-1">Iniciá sesión con tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                leftIcon={<Mail size={18} />}
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Recuérdame</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <ShoppingBag size={14} />
                ¿Querés hacer un pedido? Ingresá al menú público
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center mb-3">Acceso rápido (desarrollo)</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={async () => {
                    await login('admin@foodstore.com', 'admin123')
                    navigate('/negocio/dashboard', { replace: true })
                  }}
                >
                  Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={async () => {
                    await login('cocina@foodstore.com', 'cocina123')
                    navigate('/negocio/cocina', { replace: true })
                  }}
                >
                  Cocina
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>FoodStore © 2025</p>
            <div className="flex justify-center gap-4 mt-2">
              <button className="hover:text-gray-600 transition-colors">Terms & Conditions</button>
              <button className="hover:text-gray-600 transition-colors">Support</button>
              <button className="hover:text-gray-600 transition-colors">Privacy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

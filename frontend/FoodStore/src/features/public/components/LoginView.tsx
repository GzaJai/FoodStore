import { useState } from 'react'
import { ChevronLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'

interface LoginViewProps {
  onBack: () => void
  onLoggedIn: () => void
  onGoToRegister: () => void
}

export function LoginView({ onBack, onLoggedIn, onGoToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Completá todos los campos')
      return
    }

    const success = await login(email.trim().toLowerCase(), password)

    if (success) {
      onLoggedIn()
    } else {
      setError('Email o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col">
      <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-headline-lg-mobile font-headline">Iniciar sesión</h1>
      </header>

      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl mt-2 active:scale-95 transition-transform shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          {/* Link a registro */}
          <p className="text-center text-sm text-on-surface-variant mt-4">
            ¿No tenés cuenta?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-primary font-bold underline"
            >
              Registrate
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

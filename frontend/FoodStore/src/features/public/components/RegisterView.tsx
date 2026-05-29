import { useState } from 'react'
import { ChevronLeft, User, Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'

interface RegisterViewProps {
  onBack: () => void
  onRegistered: () => void
  onGoToLogin: () => void
}

export function RegisterView({ onBack, onRegistered, onGoToLogin }: RegisterViewProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { register, isLoading } = useAuthStore()

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!name.trim()) errors.name = 'El nombre es obligatorio'
    if (!email.trim()) errors.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido'
    if (!password) errors.password = 'La contraseña es obligatoria'
    else if (password.length < 6) errors.password = 'Mínimo 6 caracteres'
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    const success = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim() || undefined,
    })

    if (success) {
      onRegistered()
    } else {
      setError('No pudimos crear tu cuenta. El email podría ya estar registrado.')
    }
  }

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col">
      <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-headline-lg-mobile font-headline">Crear cuenta</h1>
      </header>

      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          {/* Error general */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={`w-full pl-12 pr-4 py-3 bg-white border rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                  fieldErrors.name ? 'border-red-400' : 'border-gray-200'
                }`}
              />
            </div>
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={`w-full pl-12 pr-4 py-3 bg-white border rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                  fieldErrors.email ? 'border-red-400' : 'border-gray-200'
                }`}
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                placeholder="Mínimo 6 caracteres"
                className={`w-full pl-12 pr-12 py-3 bg-white border rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                  fieldErrors.password ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Confirmar contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                className={`w-full pl-12 pr-4 py-3 bg-white border rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                  fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
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
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>

          {/* Link a login */}
          <p className="text-center text-sm text-on-surface-variant mt-4">
            ¿Ya tenés cuenta?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-primary font-bold underline"
            >
              Iniciar sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

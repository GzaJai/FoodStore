import { ChevronLeft, User, LogIn, UserPlus, UserCircle } from 'lucide-react'
import type { Page } from '../constants'
import { useAuthStore } from '../../../stores/authStore'
import { PublicBottomNav } from './PublicBottomNav'

interface ProfileViewProps {
  totalCartItems: number
  activePage: Page
  onBack: () => void
  onNavigate: (page: Page) => void
}

export function ProfileView({
  totalCartItems,
  activePage,
  onBack,
  onNavigate,
}: ProfileViewProps) {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans flex flex-col">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">
            {isAuthenticated ? 'Mi Perfil' : 'Perfil'}
          </h1>
        </div>
      </header>

      <div className="px-6 mt-4 flex-1">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg border-4 border-primary/20">
            <User size={48} />
          </div>
          <p className="text-xl font-bold">
            {isAuthenticated ? user?.name : 'Invitado'}
          </p>
          {isAuthenticated && user?.role === 'customer' && (
            <span className="text-xs text-primary font-medium mt-1 px-3 py-0.5 bg-primary/10 rounded-full">
              Cliente
            </span>
          )}
        </div>

        {isAuthenticated ? (
          /* ─── Usuario logueado: acceso a cuenta ─────────── */
          <div className="space-y-3 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('account')}
              className="w-full bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container transition-colors text-left"
            >
              <UserCircle size={22} className="text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Mi cuenta</p>
                <p className="text-xs text-on-surface-variant">Ver mis datos y pedidos</p>
              </div>
              <ChevronLeft size={18} className="text-gray-400 rotate-180 shrink-0" />
            </button>
          </div>
        ) : (
          /* ─── Invitado: login / registro ───────────────── */
          <div className="space-y-3 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('login')}
              className="w-full bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container transition-colors text-left"
            >
              <LogIn size={22} className="text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Iniciar sesión</p>
                <p className="text-xs text-on-surface-variant">Accedé a tu cuenta</p>
              </div>
              <ChevronLeft size={18} className="text-gray-400 rotate-180 shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('register')}
              className="w-full bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container transition-colors text-left"
            >
              <UserPlus size={22} className="text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Crear cuenta</p>
                <p className="text-xs text-on-surface-variant">Registrate para guardar tus datos</p>
              </div>
              <ChevronLeft size={18} className="text-gray-400 rotate-180 shrink-0" />
            </button>
          </div>
        )}
      </div>

      <PublicBottomNav
        activePage={activePage}
        totalCartItems={totalCartItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}

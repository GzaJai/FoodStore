import { ChevronLeft, User, Phone, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Page } from '../constants'
import { PublicBottomNav } from './PublicBottomNav'

interface ProfileViewProps {
  customerName: string
  customerPhone: string
  customerEmail: string
  totalCartItems: number
  activePage: Page
  onNameChange: (name: string) => void
  onPhoneChange: (phone: string) => void
  onEmailChange: (email: string) => void
  onSave: () => void
  onBack: () => void
  onNavigate: (page: Page) => void
}

export function ProfileView({
  customerName,
  customerPhone,
  customerEmail,
  totalCartItems,
  activePage,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onSave,
  onBack,
  onNavigate,
}: ProfileViewProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans flex flex-col">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Mi Perfil</h1>
        </div>
      </header>

      <div className="px-6 mt-4 flex-1">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg border-4 border-primary/20">
            <User size={48} />
          </div>
          <p className="text-xl font-bold">{customerName || 'Usuario Foodgo'}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Tu nombre"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none"
              />
            </div>
          </div>

          <button
            onClick={onSave}
            className="w-full bg-primary-container text-white font-bold py-4 rounded-2xl mt-4 active:scale-95 transition-transform shadow-md"
          >
            Guardar Cambios
          </button>

          <div className="mt-8 text-center pb-8">
            <Link to="/negocio/login" className="text-primary font-bold text-sm underline">
              Ingreso para negocios
            </Link>
          </div>
        </div>
      </div>

      <PublicBottomNav
        activePage={activePage}
        totalCartItems={totalCartItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}

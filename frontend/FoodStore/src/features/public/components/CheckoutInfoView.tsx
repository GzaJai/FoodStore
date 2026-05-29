import { ChevronLeft, User, Phone, Mail, CheckCircle } from 'lucide-react'
import type { PublicOrderPayload } from '../../../api/public'
import type { Page } from '../constants'
import { CHANNELS } from '../constants'
import { PublicBottomNav } from './PublicBottomNav'
import { useAuthStore } from '../../../stores/authStore'
import { DeliveryAddressForm } from './DeliveryAddressForm'

interface CheckoutInfoViewProps {
  customerName: string
  customerPhone: string
  customerEmail: string
  channel: PublicOrderPayload['channel']
  address: string
  notes: string
  formError: string | null
  fieldErrors?: Record<string, string>
  totalCartItems: number
  activePage: Page
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onEmailChange: (value: string) => void
  onChannelChange: (channel: PublicOrderPayload['channel']) => void
  onAddressChange: (value: string) => void
  onNotesChange: (value: string) => void
  onBack: () => void
  onNext: () => void
  onNavigate: (page: Page) => void
}

const inputBase = (hasError: boolean) =>
  `w-full pl-10 pr-3 py-3 bg-surface-container-lowest rounded-xl text-body-sm focus:ring-2 outline-none placeholder:text-on-surface-variant/50 ${
    hasError
      ? 'border-2 border-red-500 text-red-700 focus:ring-red-300 focus:border-red-500'
      : 'border border-outline-variant focus:ring-primary focus:border-primary-container'
  }`

export function CheckoutInfoView({
  customerName,
  customerPhone,
  customerEmail,
  channel,
  address,
  notes,
  formError,
  fieldErrors = {},
  totalCartItems,
  activePage,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onChannelChange,
  onAddressChange,
  onNotesChange,
  onBack,
  onNext,
  onNavigate,
}: CheckoutInfoViewProps) {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col pb-24">
      <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-headline-lg-mobile font-headline">Tus datos</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <div className="w-6 h-0.5 bg-outline-variant" />
          <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-body-sm rounded-xl p-3">
            {formError}
          </div>
        )}

        {/* Si está logueado mostramos un resumen de sus datos */}
        {isAuthenticated ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <p className="text-label-md font-label text-primary flex items-center gap-2">
              <CheckCircle size={16} />
              Datos vinculados a tu cuenta
            </p>
            <div className="text-body-sm text-on-surface space-y-1">
              <p className="flex items-center gap-2">
                <User size={14} className="text-primary shrink-0" />
                {customerName}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-primary shrink-0" />
                {customerPhone || '—'}
              </p>
              {customerEmail && (
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-primary shrink-0" />
                  {customerEmail}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className={`text-label-md font-label mb-1 block ${fieldErrors.name ? 'text-red-600' : 'text-on-surface-variant'}`}>
                Nombre *
              </label>
              <div className="relative">
                <User size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${fieldErrors.name ? 'text-red-500' : 'text-outline'}`} />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Tu nombre"
                  className={inputBase(!!fieldErrors.name)}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-red-500 text-body-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className={`text-label-md font-label mb-1 block ${fieldErrors.phone ? 'text-red-600' : 'text-on-surface-variant'}`}>
                Teléfono *
              </label>
              <div className="relative">
                <Phone size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${fieldErrors.phone ? 'text-red-500' : 'text-outline'}`} />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className={inputBase(!!fieldErrors.phone)}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-red-500 text-body-sm mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="text-label-md font-label text-on-surface-variant mb-1 block">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-label-md font-label text-on-surface-variant mb-2 block">¿Cómo querés recibirlo?</label>
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              return (
                <button
                  key={ch.value}
                  onClick={() => onChannelChange(ch.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                    channel === ch.value
                      ? 'border-primary-container bg-white/10 text-primary'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-label-md font-label">{ch.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {channel === 'DELIVERY' && (
          <div>
            <label className={`text-label-md font-label mb-2 block ${fieldErrors.address ? 'text-red-600' : 'text-on-surface-variant'}`}>
              Dirección de entrega *
            </label>
            <DeliveryAddressForm address={address} onAddressChange={onAddressChange} />
            {fieldErrors.address && (
              <p className="text-red-500 text-body-sm mt-1">{fieldErrors.address}</p>
            )}
          </div>
        )}

        <div>
          <label className="text-label-md font-label text-on-surface-variant mb-1 block">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Alguna aclaración?"
            rows={3}
            className="w-full px-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none resize-none placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest border-t border-outline-variant p-4">
        <button
          onClick={onNext}
          className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
        >
          Ir a pagar
        </button>
      </div>

      <PublicBottomNav
        activePage={activePage}
        totalCartItems={totalCartItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}

import { ChevronLeft, Check, Loader2, User, Phone, Mail, Bike, ShoppingBag, UtensilsCrossed, Store } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import type { PublicOrderPayload } from '../../../api/public'
import { formatPrice } from '../constants'

interface CheckoutPaymentViewProps {
  items: { product: ApiProductResponse; quantity: number }[]
  customerName: string
  customerPhone: string
  customerEmail: string
  channel: PublicOrderPayload['channel']
  address: string
  formError: string | null
  isProcessing: boolean
  onBack: () => void
  onConfirm: () => void
}

export function CheckoutPaymentView({
  items,
  customerName,
  customerPhone,
  customerEmail,
  channel,
  address,
  formError,
  isProcessing,
  onBack,
  onConfirm,
}: CheckoutPaymentViewProps) {
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.21
  const total = subtotal + tax

  const channelLabel = channel === 'TAKEAWAY' ? 'Take Away' : channel === 'DELIVERY' ? 'Delivery' : 'Mesa'
  const ChannelIcon = channel === 'DELIVERY' ? Bike : channel === 'TABLE' ? UtensilsCrossed : ShoppingBag

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col">
      <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-headline-lg-mobile font-headline">Confirmar pago</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <div className="w-6 h-0.5 bg-primary" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {formError && (
          <div className="bg-error-container text-on-error-container text-body-sm rounded-xl p-3">
            {formError}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow space-y-2">
          <p className="text-title-md font-title text-on-surface mb-2">Resumen del pedido</p>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-body-sm">
              <span className="text-on-surface-variant">{item.quantity}x {item.product.name}</span>
              <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-outline-variant pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>IVA (21%)</span><span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-title-md font-bold text-on-surface pt-1">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow text-body-sm text-on-surface-variant space-y-1.5">
          <p className="flex items-center gap-2"><User size={16} /> {customerName}</p>
          <p className="flex items-center gap-2"><Phone size={16} /> {customerPhone}</p>
          {customerEmail && <p className="flex items-center gap-2"><Mail size={16} /> {customerEmail}</p>}
          <p className="flex items-center gap-2">
            <ChannelIcon size={16} />
            {channelLabel}
            {channel === 'DELIVERY' && address && ` — ${address}`}
          </p>
        </div>

        <div className="bg-surface-container rounded-xl p-3 text-body-sm text-on-surface-variant flex items-start gap-2">
          <Store size={16} className="mt-0.5 shrink-0" />
          <span>
            Pago simulado. {/* TODO: Integrar con Mercado Pago */}
            Cuando integremos Mercado Pago, aquí se abrirá el checkout para pagar con débito, crédito o efectivo.
          </span>
        </div>
      </div>

      <div className="bg-surface-container-lowest border-t border-outline-variant p-4 space-y-2">
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-body-sm text-on-surface-variant">
            <Loader2 size={16} className="animate-spin" />
            Procesando pago...
          </div>
        )}
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-transform text-body-lg disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Check size={20} />
              Confirmar pago
            </>
          )}
        </button>
      </div>
    </div>
  )
}

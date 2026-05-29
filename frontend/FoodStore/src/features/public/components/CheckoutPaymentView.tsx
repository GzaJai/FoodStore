import { useState } from 'react'
import { ChevronLeft, Loader2, User, Phone, Mail, Bike, ShoppingBag, UtensilsCrossed, AlertTriangle, Check } from 'lucide-react'
import { CardPayment } from '@mercadopago/sdk-react'
import type { ApiProductResponse } from '../../../types/api'
import type { PublicOrderPayload } from '../../../api/public'
import { createPaymentApi } from '../../../api/public'
import type { CreatePaymentPayload } from '../../../api/public'
import { formatPrice } from '../constants'
import { TestCardHelper } from './TestCardHelper'

interface CheckoutPaymentViewProps {
  items: { product: ApiProductResponse; quantity: number }[]
  customerName: string
  customerPhone: string
  customerEmail: string
  channel: PublicOrderPayload['channel']
  address: string
  notes: string
  formError: string | null
  onBack: () => void
  onPaymentComplete: (orderNumber: string) => void
  onClearCart: () => void
}

type PaymentState = 'form' | 'processing' | 'approved' | 'rejected' | 'error'

export function CheckoutPaymentView({
  items,
  customerName,
  customerPhone,
  customerEmail,
  channel,
  address,
  notes,
  formError,
  onBack,
  onPaymentComplete,
  onClearCart,
}: CheckoutPaymentViewProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('form')
  const [approvedOrderNumber, setApprovedOrderNumber] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [brickKey, setBrickKey] = useState(0)

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.21
  const total = subtotal + tax

  const channelLabel = channel === 'TAKEAWAY' ? 'Take Away' : channel === 'DELIVERY' ? 'Delivery' : 'Mesa'
  const ChannelIcon = channel === 'DELIVERY' ? Bike : channel === 'TABLE' ? UtensilsCrossed : ShoppingBag

  // ─── Procesar pago (compartido entre brick y tarjeta guardada) ────
  const processPayment = async (card_token: string) => {
    setPaymentState('processing')
    setApiError(null)

    try {
      const payload: CreatePaymentPayload = {
        card_token,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        channel,
        address: channel === 'DELIVERY' ? address.trim() : undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      }

      const result = await createPaymentApi(payload)

      if (result.status === 'approved') {
        setPaymentState('approved')
        setApprovedOrderNumber(result.order_number)
        onClearCart()

        // Auto-redirect a confirmed después de 2 segundos
        setTimeout(() => {
          onPaymentComplete(result.order_number!)
        }, 2000)
      } else if (result.status === 'rejected') {
        setPaymentState('rejected')
      } else {
        // in_process, pending, etc
        setPaymentState('error')
        setApiError(
          result.status_detail
            ? `El pago quedó en estado "${result.status}": ${result.status_detail}`
            : `El pago quedó en estado "${result.status}". Te avisaremos cuando se confirme.`
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago'
      setApiError(message)
      setPaymentState('rejected')
    }
  }

  // ─── Submit del CardPayment brick ─────────────────────────────────
  const handlePaymentSubmit = async (param: { token: string }) => {
    await processPayment(param.token)
  }

  // El TestCardHelper genera el token via API de MP y lo pasa acá
  const handleTestCardPayment = (token: string) => {
    processPayment(token)
  }

  const handleRetry = () => {
    setApiError(null)
    setPaymentState('form')
    setBrickKey((k) => k + 1)
  }

  // ─── Render: Pago aprobado ────────────────────────────────────────
  if (paymentState === 'approved') {
    return (
      <div className="min-h-screen bg-white text-on-surface flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-primary" />
          </div>
          <h2 className="text-headline-lg font-headline text-on-surface mb-2">¡Pago aprobado!</h2>
          <p className="text-body-lg text-on-surface-variant mb-6">Tu pedido ya está en cocina</p>

          {approvedOrderNumber && (
            <div className="bg-surface-container-lowest border border-primary/20 rounded-xl p-5 mb-6 inline-block">
              <p className="text-label-md font-label text-primary mb-1">Número de pedido</p>
              <p className="text-display-lg font-display text-primary font-extrabold">{approvedOrderNumber}</p>
            </div>
          )}

          <p className="text-body-sm text-on-surface-variant mb-8">
            Te avisaremos cuando esté listo. Guardá el número de pedido para retirar.
          </p>

          <button
            onClick={() => approvedOrderNumber && onPaymentComplete(approvedOrderNumber)}
            className="bg-primary text-on-primary font-bold py-4 px-8 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
          >
            Ver mis pedidos
          </button>
        </div>
      </div>
    )
  }

  // ─── Render: Error de pago (no approved ni rejected, ej: pending) ─
  if (paymentState === 'error') {
    return (
      <div className="min-h-screen bg-white text-on-surface flex flex-col">
        <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
          <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-headline-lg-mobile font-headline">Confirmar pago</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle size={48} className="text-amber-500 mb-4" />
          <p className="text-body-lg text-on-surface-variant mb-2">Pago en proceso</p>
          <p className="text-body-sm text-on-surface-variant mb-6">{apiError}</p>
          <button
            onClick={() => { setPaymentState('form'); setBrickKey((k) => k + 1) }}
            className="bg-primary text-on-primary font-bold py-3 px-8 rounded-full active:scale-[0.98] transition-transform"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ─── Render: Formulario de pago ──────────────────────────────────
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
          <div className="w-10 h-0.5 bg-primary" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Error de validación del form */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-body-sm rounded-xl p-3">
            {formError}
          </div>
        )}

        {/* Error del pago (rechazado) */}
        {paymentState === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-body-md font-bold text-red-700 mb-1">Pago rechazado</p>
                <p className="text-body-sm text-red-600 mb-3">
                  {apiError || 'El pago no pudo ser procesado. Verificá los datos de la tarjeta e intentá de nuevo.'}
                </p>
                <button
                  onClick={handleRetry}
                  className="bg-red-600 text-white font-bold py-2 px-6 rounded-full text-body-sm active:scale-[0.98] transition-transform"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {paymentState === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-body-md text-on-surface-variant">Procesando pago...</p>
          </div>
        )}

        {/* Resumen del pedido */}
        <div className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow space-y-2">
          <p className="text-title-md font-title text-on-surface mb-2">Resumen del pedido</p>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-body-sm">
              <span className="text-on-surface-variant">
                {item.quantity}x {item.product.name}
              </span>
              <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-outline-variant pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>IVA (21%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-title-md font-bold text-on-surface pt-1">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow text-body-sm text-on-surface-variant space-y-1.5">
          <p className="flex items-center gap-2">
            <User size={16} /> {customerName}
          </p>
          <p className="flex items-center gap-2">
            <Phone size={16} /> {customerPhone}
          </p>
          {customerEmail && (
            <p className="flex items-center gap-2">
              <Mail size={16} /> {customerEmail}
            </p>
          )}
          <p className="flex items-center gap-2">
            <ChannelIcon size={16} />
            {channelLabel}
            {channel === 'DELIVERY' && address && ` — ${address}`}
          </p>
        </div>

        {/* Helper de tarjetas de prueba (solo con VITE_MP_TEST_CARD_NUMBER configurado) */}
        <TestCardHelper onTestPayment={handleTestCardPayment} />
      </div>

      {/* Footer con métodos de pago */}
      <div className="bg-surface-container-lowest border-t border-outline-variant p-4">
        {paymentState === 'form' && (
          <div key={brickKey} className="space-y-3">
            <CardPayment
              initialization={{
                amount: total,
                payer: { email: customerEmail || undefined },
              }}
              onSubmit={handlePaymentSubmit}
              locale="es-AR"
              onError={(error) => {
                console.error('CardPayment brick error:', error)
                setApiError('Error en el formulario de pago. Intentalo de nuevo.')
                setPaymentState('rejected')
              }}
            />
            <p className="text-xs text-center text-gray-400">
              Pagá con débito o crédito. Tus datos están protegidos por Mercado Pago.
            </p>
          </div>
        )}

        {paymentState === 'processing' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={20} className="animate-spin text-on-surface-variant" />
            <p className="text-body-sm text-on-surface-variant">Procesando pago...</p>
          </div>
        )}
      </div>
    </div>
  )
}

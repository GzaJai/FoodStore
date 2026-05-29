import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, CreditCard, Zap, Loader2 } from 'lucide-react'

interface TestCardField {
  label: string
  value: string
}

interface TestCardHelperProps {
  onTestPayment: (token: string) => void
}

export function TestCardHelper({ onTestPayment }: TestCardHelperProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardNumber = import.meta.env.VITE_MP_TEST_CARD_NUMBER as string
  const expiry = import.meta.env.VITE_MP_TEST_CARD_EXPIRY as string
  const cvv = import.meta.env.VITE_MP_TEST_CARD_CVV as string
  const cardName = import.meta.env.VITE_MP_TEST_CARD_NAME as string
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string

  // Solo se muestra si hay datos de tarjeta de prueba configurados
  if (!cardNumber || !publicKey) return null

  const fields: TestCardField[] = [
    { label: 'Número', value: cardNumber },
    { label: 'Vence', value: expiry || '11/25' },
    { label: 'CVV', value: cvv || '123' },
    { label: 'Titular', value: cardName || 'APRO' },
  ]

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch {
      // fallback: seleccionar el texto
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    }
  }

  const handleQuickPay = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Parsear expiry "MM/YY" → month, year
      const [monthStr, yearStr] = (expiry || '11/25').split('/')
      const expMonth = parseInt(monthStr, 10)
      const expYear = parseInt(yearStr, 10) + 2000

      // Llamar a la API de tokenización de Mercado Pago
      const response = await fetch(
        `https://api.mercadopago.com/v1/card_tokens?public_key=${publicKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_number: cardNumber,
            expiration_month: expMonth,
            expiration_year: expYear,
            security_code: cvv || '123',
            cardholder: {
              name: cardName || 'APRO',
              identification: {
                type: 'DNI',
                number: '12345678',
              },
            },
          }),
        },
      )

      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new Error(errBody?.message || errBody?.cause?.[0]?.description || `Error ${response.status} al generar token`)
      }

      const data = await response.json()
      const token = data.id as string

      if (!token) {
        throw new Error('No se recibió un token de Mercado Pago')
      }

      // Cerrar el panel y pasar el token al callback
      setIsOpen(false)
      onTestPayment(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-blue-800 hover:bg-blue-100/50 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium">
          <CreditCard size={16} />
          Tarjetas de prueba
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-blue-600 leading-relaxed">
            Tocá cada campo para copiarlo o usá el botón de pago rápido.
            El nombre del titular determina el resultado:
          </p>

          {/* Status legend */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">APRO → Aprobado</span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">OTHO → Rechazado</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">CONT → Pendiente</span>
          </div>

          {/* Card fields */}
          <div className="grid grid-cols-2 gap-2">
            {fields.map((field, i) => (
              <button
                key={field.label}
                type="button"
                onClick={() => handleCopy(field.value, i)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-blue-200 text-xs hover:border-blue-400 transition-colors text-left"
              >
                <div className="min-w-0">
                  <span className="text-blue-500 block">{field.label}</span>
                  <span className="text-blue-900 font-mono font-medium truncate block">
                    {field.value}
                  </span>
                </div>
                {copiedIndex === i ? (
                  <Check size={14} className="text-green-500 shrink-0" />
                ) : (
                  <Copy size={14} className="text-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Quick pay button */}
          <button
            type="button"
            onClick={handleQuickPay}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generando token...
              </>
            ) : (
              <>
                <Zap size={16} />
                Pagar ahora con estos datos
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

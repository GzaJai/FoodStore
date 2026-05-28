import { Check } from 'lucide-react'

interface ConfirmedViewProps {
  orderNumber: string | null
  onBackToCatalog: () => void
}

export function ConfirmedView({ orderNumber, onBackToCatalog }: ConfirmedViewProps) {
  return (
    <div className="min-h-screen bg-white text-on-surface flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-primary" />
        </div>
        <h2 className="text-headline-lg font-headline text-on-surface mb-2">¡Pedido confirmado!</h2>
        <p className="text-body-lg text-on-surface-variant mb-6">Tu pedido ya está en cocina</p>

        {orderNumber && (
          <div className="bg-white/10 border border-primary/20 rounded-xl p-5 mb-6 inline-block">
            <p className="text-label-md font-label text-primary mb-1">Número de pedido</p>
            <p className="text-display-lg font-display text-primary font-extrabold">{orderNumber}</p>
          </div>
        )}

        <p className="text-body-sm text-on-surface-variant mb-8">
          Te avisaremos cuando esté listo. Guardá el número de pedido para retirar.
        </p>

        <button
          onClick={onBackToCatalog}
          className="bg-primary text-on-primary font-bold py-4 px-8 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
        >
          Seguir viendo el menú
        </button>
      </div>
    </div>
  )
}

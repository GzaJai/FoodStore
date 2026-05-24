import { ChevronLeft, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import type { Page } from '../constants'
import { formatPrice, CATEGORY_BG, CATEGORY_EMOJI } from '../constants'
import { PublicBottomNav } from './PublicBottomNav'

interface CartViewProps {
  items: { product: ApiProductResponse; quantity: number }[]
  totalCartItems: number
  activePage: Page
  onUpdateQuantity: (productId: string, quantity: number) => void
  onBack: () => void
  onCheckout: () => void
  onNavigate: (page: Page) => void
}

export function CartView({
  items,
  totalCartItems,
  activePage,
  onUpdateQuantity,
  onBack,
  onCheckout,
  onNavigate,
}: CartViewProps) {
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.21
  const total = subtotal + tax

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col pb-24">
      <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-headline-lg-mobile font-headline">Tu pedido</h1>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={48} className="mx-auto text-outline mb-4" />
            <p className="text-body-lg text-on-surface-variant">El carrito está vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: CATEGORY_BG[item.product.category] ?? '#F5F5F5' }}
              >
                {CATEGORY_EMOJI[item.product.category] ?? '🍴'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-title-md font-title text-on-surface truncate">{item.product.name}</p>
                <p className="text-body-sm text-on-surface-variant">{formatPrice(item.product.price)} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="text-sm font-bold min-w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="bg-surface-container-lowest border-t border-outline-variant p-4 space-y-3">
          <div className="flex justify-between text-body-sm text-on-surface-variant">
            <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-body-sm text-on-surface-variant">
            <span>IVA (21%)</span><span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between text-title-md font-bold text-on-surface border-t border-outline-variant pt-2">
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
          >
            Continuar
          </button>
        </div>
      )}

      <PublicBottomNav
        activePage={activePage}
        totalCartItems={totalCartItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}

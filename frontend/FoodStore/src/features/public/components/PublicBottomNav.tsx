import { Home, ShoppingCart, User } from 'lucide-react'
import type { Page } from '../constants'

interface PublicBottomNavProps {
  activePage: Page
  totalCartItems: number
  onNavigate: (page: Page) => void
}

export function PublicBottomNav({ activePage, totalCartItems, onNavigate }: PublicBottomNavProps) {
  const isCartActive = activePage === 'cart' || activePage === 'checkout-info' || activePage === 'checkout-payment'

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-primary-container z-50 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-3xl">
      <div className="flex justify-around items-center px-8 relative">
        <button
          className={`transition-colors ${activePage === 'profile' ? 'text-white' : 'text-white/60'}`}
          onClick={() => onNavigate('profile')}
        >
          <User size={28} strokeWidth={2.5} />
        </button>

        <button onClick={() => onNavigate('catalog')} className="relative transition-colors">
          <div className="bg-white text-primary-container w-14 h-14 rounded-full flex items-center justify-center -mt-8 shadow-xl active:scale-95 transition-transform">
            <Home size={32} strokeWidth={2.5} />
          </div>
        </button>

        <button
          onClick={() => onNavigate('cart')}
          className={`relative transition-colors ${isCartActive ? 'text-white' : 'text-white/60'}`}
        >
          <ShoppingCart size={28} strokeWidth={2.5} />
          {totalCartItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-primary">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}

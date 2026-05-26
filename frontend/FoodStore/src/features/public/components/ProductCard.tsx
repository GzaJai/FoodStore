import { Plus, AlertTriangle } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import { formatPrice, PRODUCT_IMAGES, CATEGORY_EMOJI } from '../constants'
import { useCartStore } from '../../../stores/cartStore'

interface ProductCardProps {
  product: ApiProductResponse
  onSelect: (product: ApiProductResponse) => void
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const imgUrl = PRODUCT_IMAGES[product.name]
  const hasAllergens = product.ingredients?.some((i) => i.is_allergen) ?? false
  const allergenNames = product.ingredients
    ?.filter((i) => i.is_allergen)
    .map((i) => i.name)
    .join(', ') ?? ''

  return (
    <div
      className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden relative cursor-pointer"
      onClick={() => onSelect(product)}
    >
      {hasAllergens && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md" title={allergenNames}>
            <AlertTriangle size={10} />
            Alérgenos
          </div>
        </div>
      )}

      <div className="relative w-full aspect-square p-4 pb-0 flex items-center justify-center bg-white">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="text-6xl flex items-center justify-center w-full h-full bg-gray-50 rounded-2xl">
            {CATEGORY_EMOJI[product.category] ?? '🍴'}
          </div>
        )}
      </div>

      <div className="p-4 pt-3 flex flex-col flex-1">
        <h3 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{product.name}</h3>
        <p className="text-[13px] text-gray-500 mt-0.5 font-medium line-clamp-1">{product.category}</p>
          <div className="flex items-center justify-between mt-auto pt-3">
            <span className="text-[15px] font-bold text-primary-container">{formatPrice(product.price)}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); addItem(product); }} 
              className="bg-primary-container text-white p-1.5 rounded-full shadow-sm active:scale-90 transition-transform"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
      </div>
    </div>
  )
}

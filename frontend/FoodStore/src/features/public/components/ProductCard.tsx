import { Star, Heart } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import { PRODUCT_IMAGES, CATEGORY_EMOJI } from '../constants'

interface ProductCardProps {
  product: ApiProductResponse
  onSelect: (product: ApiProductResponse) => void
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const imgUrl = PRODUCT_IMAGES[product.name]

  return (
    <div
      className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden relative cursor-pointer"
      onClick={() => onSelect(product)}
    >
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
          <div className="flex items-center gap-1.5 text-[14px] font-bold text-gray-800">
            <Star size={14} className="fill-[#ffc107] text-[#ffc107]" />
            <span>4.8</span>
          </div>
          <button onClick={(e) => { e.stopPropagation() }} className="text-gray-800 active:scale-90 transition-transform">
            <Heart size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

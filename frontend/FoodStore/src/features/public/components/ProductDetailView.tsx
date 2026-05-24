import { ChevronLeft, Minus, Plus } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import { formatPrice, PRODUCT_IMAGES, CATEGORY_EMOJI } from '../constants'

interface ProductDetailViewProps {
  product: ApiProductResponse
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  onBack: () => void
}

export function ProductDetailView({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBack,
}: ProductDetailViewProps) {
  const imgUrl = PRODUCT_IMAGES[product.name]

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans flex flex-col">
      {/* Top red section */}
      <div className="bg-primary-container rounded-b-[40px] pt-8 px-6 pb-24 relative shadow-xl">
        <div className="flex items-center justify-between text-white mb-6 relative z-10">
          <button
            onClick={onBack}
            className="bg-white text-primary w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-sm"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Image overlapping */}
      <div className="relative -mt-32 px-8 flex justify-center z-10 h-64">
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} className="w-full h-full object-contain drop-shadow-2xl" />
        ) : (
          <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center text-6xl shadow-2xl">
            {CATEGORY_EMOJI[product.category] ?? '🍴'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 mt-6 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight pr-4">{product.name}</h2>
          <span className="text-xl font-bold text-primary whitespace-nowrap">{formatPrice(product.price)}</span>
        </div>
        <p className="text-gray-500 font-medium text-sm mb-6">{product.category}</p>

        <div className="flex gap-4 mb-6">
          <button className="bg-primary-container text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md">
            Detalles
          </button>
          <button className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-bold text-sm">
            Reseñas
          </button>
        </div>

        <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
          {product.description || 'Delicioso plato preparado con los mejores ingredientes frescos. Perfecto para disfrutar en cualquier momento.'}
        </p>
      </div>

      {/* Bottom Action */}
      <div className="px-6 flex items-center justify-between mb-8 mt-auto gap-4">
        <div className="flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-full px-2 py-2 w-32">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="bg-primary-container text-white w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <Minus size={16} strokeWidth={3} />
          </button>
          <span className="font-bold text-lg text-center w-8">{quantity}</span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="bg-primary-container text-white w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
        <button
          onClick={onAddToCart}
          className="bg-primary-container text-white font-bold py-4 px-8 rounded-full flex-1 shadow-lg active:scale-95 transition-transform"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  )
}

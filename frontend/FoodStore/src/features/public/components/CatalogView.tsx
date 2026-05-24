import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import type { Page } from '../constants'
import { CategoryPills } from './CategoryPills'
import { ProductCard } from './ProductCard'
import { PublicBottomNav } from './PublicBottomNav'

interface CatalogViewProps {
  products: ApiProductResponse[]
  isLoading: boolean
  categories: string[]
  activeCategory: string
  totalCartItems: number
  activePage: Page
  onCategorySelect: (category: string) => void
  onProductSelect: (product: ApiProductResponse) => void
  onNavigate: (page: Page) => void
}

export function CatalogView({
  products,
  isLoading,
  categories,
  activeCategory,
  totalCartItems,
  activePage,
  onCategorySelect,
  onProductSelect,
  onNavigate,
}: CatalogViewProps) {
  const filteredProducts = activeCategory === 'ALL' ? products : products.filter((p) => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-4">
        <h1 className="text-5xl font-normal text-black font-lobster tracking-wide">Foodgo</h1>
        <p className="text-gray-500 text-[15px] mt-2 mb-6 font-medium">¡Pedí tu comida favorita!</p>

        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex items-center px-4 py-3.5 shadow-sm">
            <Search size={22} className="text-gray-700 mr-2" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 font-medium"
            />
          </div>
          <div className="bg-primary-container rounded-2xl p-3.5 text-white shadow-md active:scale-95 transition-transform cursor-pointer">
            <SlidersHorizontal size={22} strokeWidth={2.5} />
          </div>
        </div>
      </header>

      {/* Categories */}
      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onSelect={onCategorySelect}
      />

      {/* Products Grid */}
      <main className="mt-6 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={onProductSelect} />
            ))}
          </div>
        )}
      </main>

      <PublicBottomNav
        activePage={activePage}
        totalCartItems={totalCartItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}

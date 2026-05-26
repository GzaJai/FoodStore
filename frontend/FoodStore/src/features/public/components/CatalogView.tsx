import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Loader2, Check } from 'lucide-react'
import type { ApiProductResponse } from '../../../types/api'
import type { Page, SortOption } from '../constants'
import { SORT_LABELS } from '../constants'
import { CategoryPills } from './CategoryPills'
import { ProductCard } from './ProductCard'
import { PublicBottomNav } from './PublicBottomNav'

interface CatalogViewProps {
  products: ApiProductResponse[]
  isLoading: boolean
  categories: string[]
  activeCategory: string
  searchQuery: string
  sortBy: SortOption
  totalCartItems: number
  activePage: Page
  onSearchChange: (query: string) => void
  onCategorySelect: (category: string) => void
  onSortChange: (sort: SortOption) => void
  onProductSelect: (product: ApiProductResponse) => void
  onNavigate: (page: Page) => void
}

export function CatalogView({
  products,
  isLoading,
  categories,
  activeCategory,
  searchQuery,
  sortBy,
  totalCartItems,
  activePage,
  onSearchChange,
  onCategorySelect,
  onSortChange,
  onProductSelect,
  onNavigate,
}: CatalogViewProps) {
  const [showFilters, setShowFilters] = useState(false)

  const filteredProducts = useMemo(() => {
    let result = products

    // Filter by category
    if (activeCategory !== 'ALL') {
      result = result.filter((p) => p.category === activeCategory)
    }

    // Filter by search query
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)),
      )
    }

    // Apply sorting
    if (sortBy !== 'default') {
      result = [...result]
      switch (sortBy) {
        case 'name-asc':
          result.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name-desc':
          result.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'price-asc':
          result.sort((a, b) => a.price - b.price)
          break
        case 'price-desc':
          result.sort((a, b) => b.price - a.price)
          break
      }
    }

    return result
  }, [products, activeCategory, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-4">
        <h1 className="text-5xl font-normal text-black font-lobster tracking-wide">Foodgo</h1>
        <p className="text-gray-500 text-[15px] mt-2 mb-6 font-medium">¡Pedí tu comida favorita!</p>

        {/* Search + Filter button */}
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex items-center px-4 py-3.5 shadow-sm">
            <Search size={22} className="text-gray-700 mr-2" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Buscar"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 font-medium"
            />
          </div>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`rounded-2xl p-3.5 text-white shadow-md active:scale-95 transition-all cursor-pointer ${
              showFilters || sortBy !== 'default'
                ? 'bg-primary-container ring-2 ring-primary-container-light'
                : 'bg-primary-container'
            }`}
          >
            <SlidersHorizontal size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-fade-in">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Ordenar por
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => {
                const isActive = sortBy === value
                return (
                  <button
                    key={value}
                    onClick={() => {
                      onSortChange(value)
                      setShowFilters(false)
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-container text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isActive && <Check size={14} strokeWidth={3} />}
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
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
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-400 text-lg font-medium">Sin resultados</p>
            <p className="text-gray-400 text-sm mt-1">Probá con otro término de búsqueda</p>
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

interface CategoryPillsProps {
  categories: string[]
  activeCategory: string
  onSelect: (category: string) => void
}

export function CategoryPills({ categories, activeCategory, onSelect }: CategoryPillsProps) {
  return (
    <section className="mt-4 px-6">
      <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar items-center">
        {categories.map((cat) => {
          const isAll = cat === 'ALL'
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`flex-none text-[15px] transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-container text-white rounded-2xl px-6 py-2.5 font-bold shadow-md'
                  : 'border border-gray-200 text-gray-700 bg-white rounded-2xl px-5 py-2.5 font-medium'
              }`}
            >
              {isAll ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          )
        })}
      </div>
    </section>
  )
}

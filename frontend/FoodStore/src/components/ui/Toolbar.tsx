import { RefreshCw, Plus, BarChart3 } from 'lucide-react'
import { Button } from './Button'
import { SearchInput } from './SearchInput'
import { Select } from './Select'

export interface ToolbarProps {
  title: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchClear?: () => void
  searchPlaceholder?: string
  filterOptions?: { value: string; label: string }[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  onRefresh?: () => void
  onAdd?: () => void
  onStats?: () => void
  addLabel?: string
}

export function Toolbar({
  title,
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = 'Buscar...',
  filterOptions,
  filterValue,
  onFilterChange,
  onRefresh,
  onAdd,
  onStats,
  addLabel = 'Nuevo',
}: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange !== undefined && (
          <SearchInput
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onSearchClear}
            placeholder={searchPlaceholder}
            className="w-48"
          />
        )}
        {filterOptions && onFilterChange && (
          <Select
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            options={filterOptions}
          />
        )}
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw size={16} />
          </Button>
        )}
        {onAdd && (
          <Button variant="primary" onClick={onAdd} leftIcon={<Plus size={16} />}>
            {addLabel}
          </Button>
        )}
        {onStats && (
          <Button variant="outline" size="icon" onClick={onStats}>
            <BarChart3 size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

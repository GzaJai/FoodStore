import { Search, X } from 'lucide-react'
import { Input } from './Input'

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onClear?: () => void
}

export function SearchInput({ value, onClear, className = '', ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <Input
        value={value}
        leftIcon={<Search size={16} />}
        className={`pl-9 pr-${value ? '10' : '4'} ${className}`}
        {...props}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

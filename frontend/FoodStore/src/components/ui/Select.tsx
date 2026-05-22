import { forwardRef } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={containerClassName}>
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            outline-none transition-all bg-white
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }

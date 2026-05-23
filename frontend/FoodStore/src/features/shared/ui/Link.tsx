import { forwardRef } from 'react'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
  variant?: 'default' | 'muted' | 'primary'
  underline?: boolean
}

const variantStyles = {
  default: 'text-gray-700 hover:text-blue-600',
  muted: 'text-gray-400 hover:text-gray-600',
  primary: 'text-blue-600 hover:text-blue-700',
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, variant = 'default', underline = false, className = '', ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={`
          inline-flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer
          ${variantStyles[variant]}
          ${underline ? 'underline underline-offset-4' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </a>
    )
  }
)

Link.displayName = 'Link'

export { Link }

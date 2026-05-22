export interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  bordered?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className = '', hoverable = false, bordered = true, padding = 'md' }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl
        ${bordered ? 'border border-gray-200' : ''}
        ${hoverable ? 'hover:shadow-md transition-shadow' : 'shadow-sm'}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-800 ${className}`}>{children}</h3>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>
}

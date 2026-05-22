import type { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title = 'Sin resultados',
  description = 'No hay elementos para mostrar',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {Icon && <Icon size={48} className="text-gray-300 mb-4" />}
      {title && <h3 className="text-lg font-medium text-gray-600">{title}</h3>}
      {description && <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

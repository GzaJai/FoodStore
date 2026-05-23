import { type OrderStatus } from '../../../stores/orderStore'
import { Badge } from '../../shared/ui/Badge'

export interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  pending: { label: 'Pendiente', variant: 'danger' },
  preparing: { label: 'En preparación', variant: 'info' },
  ready: { label: 'Listo', variant: 'success' },
  sent: { label: 'Enviado', variant: 'default' },
  billed: { label: 'Facturado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'neutral' },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant} size={size}>{config.label}</Badge>
}

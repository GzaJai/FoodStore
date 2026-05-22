import { type Order, type OrderStatus } from '../../stores/orderStore'
import { Clock, Info, ChevronRight } from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'

export interface OrderCardProps {
  order: Order
  onAction?: (id: number) => void
  actionLabel?: string
  showAction?: boolean
  compact?: boolean
}

const channelConfig: Record<string, { label: string; variant: 'default' | 'info' | 'success' }> = {
  delivery: { label: 'Delivery', variant: 'default' },
  table: { label: 'Mesa', variant: 'info' },
  takeaway: { label: 'Take Away', variant: 'success' },
}

const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'sent',
  sent: 'billed',
  billed: null,
  cancelled: null,
}

export function OrderCard({ order, onAction, actionLabel, showAction = true, compact = false }: OrderCardProps) {
  const channel = channelConfig[order.channel]
  const nextStatus = nextStatusMap[order.status]
  const elapsedMin = Math.floor(Math.random() * 15)

  if (compact) {
    return (
      <Card padding="sm" hoverable className="group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-gray-800">#{order.id}</span>
            <span className="text-sm text-gray-500 truncate">{order.customer}</span>
          </div>
          <Badge variant={channel.variant} size="sm">{channel.label}</Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="sm" hoverable>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-800">#{order.id}</span>
          <Badge variant={channel.variant}>{channel.label}</Badge>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Info size={14} />
        </button>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-2">{order.customer}</p>

      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="text-xs text-gray-600 flex items-start gap-1">
            <span className="font-medium">{item.quantity}x</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          <span>{elapsedMin} min</span>
        </div>
        {showAction && nextStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAction?.(order.id)}
            rightIcon={<ChevronRight size={12} />}
          >
            {actionLabel || 'Acción'}
          </Button>
        )}
      </div>
    </Card>
  )
}

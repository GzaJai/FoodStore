import { type Order, type OrderStatus } from '../../../stores/orderStore'
import { Clock, ChevronRight } from 'lucide-react'
import { Card } from '../../shared/ui/Card'
import { Badge } from '../../shared/ui/Badge'
import { Button } from '../../shared/ui/Button'

export interface OrderCardProps {
  order: Order
  onAction?: (id: number) => void
  actionLabel?: string
  showAction?: boolean
  compact?: boolean
  onViewDetail?: (order: Order) => void
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

function formatElapsed(createdAt: Date): string {
  const min = Math.floor((Date.now() - createdAt.getTime()) / 60000)
  if (min < 1) return '~ 1 min'
  return `${min} min`
}

export function OrderCard({ order, onAction, actionLabel, showAction = true, compact = false, onViewDetail }: OrderCardProps) {
  const channel = channelConfig[order.channel]
  const nextStatus = nextStatusMap[order.status]
  const isReady = order.status === 'ready'

  if (compact) {
    return (
      <Card padding="sm" hoverable className={`group ${isReady ? '!bg-amber-50 border-amber-200' : ''}`}>
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
    <Card
      padding="sm"
      hoverable
      className={`${onViewDetail ? 'cursor-pointer' : ''} ${isReady ? '!bg-amber-50 border-amber-300' : ''}`}
      onClick={onViewDetail ? () => onViewDetail(order) : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-800">#{order.id}</span>
          <Badge variant={channel.variant}>{channel.label}</Badge>
        </div>
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
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={14} className={isReady ? 'text-amber-600' : 'text-gray-400'} />
          <span className={isReady ? 'font-medium text-amber-700' : ''}>{formatElapsed(order.createdAt)}</span>
        </div>
        {showAction && nextStatus && (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation()
              onAction?.(order.id)
            }}
            rightIcon={<ChevronRight size={12} />}
          >
            {actionLabel || 'Acción'}
          </Button>
        )}
      </div>
    </Card>
  )
}

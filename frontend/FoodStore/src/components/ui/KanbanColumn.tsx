import { type Order, type OrderStatus } from '../../stores/orderStore'
import { OrderCard } from './OrderCard'
import { EmptyState } from './EmptyState'
import { ShoppingBag } from 'lucide-react'

export interface KanbanColumnProps {
  title: string
  status: OrderStatus
  orders: Order[]
  color: string
  bg: string
  border: string
  onAction?: (id: number) => void
  actionLabel?: string
  showAction?: boolean
}

export function KanbanColumn({
  title,
  orders,
  color,
  bg,
  border,
  onAction,
  actionLabel,
  showAction = true,
}: KanbanColumnProps) {
  return (
    <div className="min-w-[280px] flex-1 flex flex-col">
      {/* Header */}
      <div className={`${bg} ${border} border rounded-t-xl px-4 py-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${color}`}>{title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color} border ${border}`}>
            {orders.length}
          </span>
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-gray-100 rounded-b-xl p-2 space-y-2 min-h-[200px] flex-1">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={onAction}
              actionLabel={actionLabel}
              showAction={showAction}
            />
          ))
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="Sin pedidos"
            description="No hay pedidos en este estado"
          />
        )}
      </div>
    </div>
  )
}

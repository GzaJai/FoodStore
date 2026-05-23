import { useState, useEffect } from 'react'
import { useOrderStore, type OrderStatus } from '../../stores/orderStore'
import type { Order } from '../../stores/orderStore'
import { useUIStore } from '../../stores/uiStore'
import { KanbanColumn } from './components/KanbanColumn'
import { Toolbar } from './components/Toolbar'
import { OrderDetailModal } from './components/OrderDetailModal'

const columns: { status: OrderStatus; label: string; color: string; bg: string; border: string; actionLabel: string }[] = [
  { status: 'pending', label: 'POR PREPARAR', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', actionLabel: '' },
  { status: 'preparing', label: 'EN PREPARACIÓN', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', actionLabel: '' },
  { status: 'ready', label: 'LISTOS PARA RETIRAR', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', actionLabel: '' },
  { status: 'sent', label: 'ENVIADOS', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', actionLabel: 'Facturar' },
  { status: 'billed', label: 'FACTURADOS', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', actionLabel: '' },
  { status: 'cancelled', label: 'CANCELADOS', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', actionLabel: '' },
]

function getNextAction(order: Order): { status: OrderStatus; label: string } | null {
  if (order.status === 'pending' || order.status === 'preparing') return null

  if (order.status === 'ready') {
    if (order.channel === 'delivery') {
      return { status: 'sent', label: 'Enviar' }
    }
    return { status: 'billed', label: 'Facturar' }
  }

  if (order.status === 'sent') {
    return { status: 'billed', label: 'Facturar' }
  }

  return null
}

const channelOptions = [
  { value: 'all', label: 'Todos los canales' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'table', label: 'Mesa' },
  { value: 'takeaway', label: 'Take Away' },
]

export default function OrderManagement() {
  const { orders, updateStatus, fetchOrders } = useOrderStore()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useUIStore((s) => s.tick)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        search === '' ||
        order.customer.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toString().includes(search) ||
        order.items.some((item) => item.name.toLowerCase().includes(search.toLowerCase()))
      const matchesChannel = channelFilter === 'all' || order.channel === channelFilter
      return matchesSearch && matchesChannel
    })
    .sort((a, b) => {
      if (a.status === 'ready' && b.status !== 'ready') return -1
      if (b.status === 'ready' && a.status !== 'ready') return 1
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Toolbar
          title="Gestión de Pedidos"
          searchValue={search}
          onSearchChange={setSearch}
          onSearchClear={() => setSearch('')}
          searchPlaceholder="Buscar pedido..."
          filterOptions={channelOptions}
          filterValue={channelFilter}
          onFilterChange={setChannelFilter}
          onRefresh={() => fetchOrders()}
          onAdd={() => {}}
          addLabel="Nuevo Pedido"
          onStats={() => {}}
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.status)
          const hasAnyAction = colOrders.some((o) => getNextAction(o) !== null)

          return (
            <KanbanColumn
              key={col.status}
              title={col.label}
              status={col.status}
              orders={colOrders}
              color={col.color}
              bg={col.bg}
              border={col.border}
              onAction={(id) => {
                const order = filteredOrders.find((o) => o.id === id)
                if (!order) return
                const action = getNextAction(order)
                if (action) updateStatus(id, action.status)
              }}
              actionLabel={(order: Order) => {
                const action = getNextAction(order)
                return action?.label || ''
              }}
              showAction={hasAnyAction}
              onViewDetail={(order) => {
                setDetailOrder(order)
                setIsDetailOpen(true)
              }}
            />
          )
        })}
      </div>

      <OrderDetailModal
        order={detailOrder}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setDetailOrder(null)
        }}
      />
    </div>
  )
}

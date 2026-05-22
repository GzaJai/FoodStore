import { useState } from 'react'
import { useOrderStore, type OrderStatus } from '../stores/orderStore'
import { KanbanColumn, Toolbar } from '../components/ui'

const columns: { status: OrderStatus; label: string; color: string; bg: string; border: string; actionLabel: string }[] = [
  { status: 'pending', label: 'POR PREPARAR', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', actionLabel: 'Preparar' },
  { status: 'cancelled', label: 'CANCELADOS', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', actionLabel: '' },
  { status: 'preparing', label: 'EN PREPARACIÓN', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', actionLabel: 'Listo' },
  { status: 'ready', label: 'LISTOS PARA RETIRAR', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', actionLabel: 'Enviar' },
  { status: 'sent', label: 'ENVIADOS', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', actionLabel: 'Facturar' },
  { status: 'billed', label: 'FACTURADOS', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', actionLabel: '' },
]

const channelOptions = [
  { value: 'all', label: 'Todos los canales' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'table', label: 'Mesa' },
  { value: 'takeaway', label: 'Take Away' },
]

export default function OrderManagement() {
  const { orders, updateStatus } = useOrderStore()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      search === '' ||
      order.customer.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString().includes(search) ||
      order.items.some((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter
    return matchesSearch && matchesChannel
  })

  const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'sent',
    sent: 'billed',
    billed: null,
    cancelled: null,
  }

  return (
    <div className="space-y-4">
      <Toolbar
        title="Gestión de Pedidos"
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        searchPlaceholder="Buscar pedido..."
        filterOptions={channelOptions}
        filterValue={channelFilter}
        onFilterChange={setChannelFilter}
        onRefresh={() => window.location.reload()}
        onAdd={() => {}}
        addLabel="Nuevo Pedido"
        onStats={() => {}}
      />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.status)
          const hasAction = !!nextStatusMap[col.status]

          return (
            <KanbanColumn
              key={col.status}
              title={col.label}
              status={col.status}
              orders={colOrders}
              color={col.color}
              bg={col.bg}
              border={col.border}
              onAction={(id) => updateStatus(id, nextStatusMap[col.status]!)}
              actionLabel={col.actionLabel}
              showAction={hasAction}
            />
          )
        })}
      </div>
    </div>
  )
}

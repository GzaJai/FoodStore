import { useState, useEffect } from 'react'
import { useOrderStore, type OrderStatus } from '../stores/orderStore'
import { Card, Avatar, Button, EmptyState } from '../components/ui'
import { Settings, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface KDSOrder {
  id: number
  customer: string
  items: { name: string; quantity: number }[]
  status: OrderStatus
  createdAt: Date
  priority?: boolean
  elapsedMinutes: number
}

const stations = ['Todas las estaciones', 'Parrilla', 'Bebidas', 'Postres', 'Entradas']

export default function KDS() {
  const { orders, updateStatus } = useOrderStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedStation, setSelectedStation] = useState('Todas las estaciones')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const kitchenOrders: KDSOrder[] = orders
    .filter((o) => ['pending', 'preparing'].includes(o.status))
    .map((o) => ({
      ...o,
      elapsedMinutes: Math.floor(Math.random() * 60) + 1,
    }))
    .sort((a, b) => {
      if (a.priority && !b.priority) return -1
      if (!a.priority && b.priority) return 1
      return a.elapsedMinutes - b.elapsedMinutes
    })

  const priorityOrders = kitchenOrders.filter((o) => o.priority || o.elapsedMinutes > 30)
  const regularOrders = kitchenOrders.filter((o) => !o.priority && o.elapsedMinutes <= 30)

  const avgTime = kitchenOrders.length > 0
    ? Math.round(kitchenOrders.reduce((acc, o) => acc + o.elapsedMinutes, 0) / kitchenOrders.length)
    : 0

  const completedOrders = orders.filter((o) => o.status === 'ready').slice(0, 3)

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-orange-400">FoodStore KDS</h1>
          <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
            CIUDAD UNIVERSITARIA
          </span>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 border border-gray-600 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            {stations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono font-bold text-white">
            {currentTime.toLocaleTimeString('es-AR')}
          </div>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex gap-4 h-full">
          {/* Priority column */}
          <div className="w-1/3 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-400" />
              <h2 className="text-lg font-semibold text-red-400">
                PRIORIDAD ({priorityOrders.length})
              </h2>
            </div>
            <div className="flex-1 space-y-3 overflow-auto">
              {priorityOrders.length > 0 ? (
                priorityOrders.map((order) => (
                  <KDSOrderCard
                    key={order.id}
                    order={order}
                    onComplete={() => updateStatus(order.id, 'ready')}
                  />
                ))
              ) : (
                <EmptyState icon={AlertTriangle} title="Sin pedidos prioritarios" className="py-12" />
              )}
            </div>
          </div>

          {/* Regular column */}
          <div className="w-1/3 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-green-400" />
              <h2 className="text-lg font-semibold text-green-400">
                EN COCINA ({regularOrders.length})
              </h2>
            </div>
            <div className="flex-1 space-y-3 overflow-auto">
              {regularOrders.length > 0 ? (
                regularOrders.map((order) => (
                  <KDSOrderCard
                    key={order.id}
                    order={order}
                    onComplete={() => updateStatus(order.id, 'ready')}
                  />
                ))
              ) : (
                <EmptyState icon={Clock} title="Sin pedidos en cola" className="py-12" />
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="w-1/3 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-400">RESUMEN</h2>
            <Card className="bg-gray-800 border-gray-700">
              <div className="space-y-4">
                <StatRow label="Total en cocina" value={kitchenOrders.length.toString()} />
                <StatRow label="Prioritarios" value={priorityOrders.length.toString()} valueColor="text-red-400" />
                <StatRow label="Regulares" value={regularOrders.length.toString()} valueColor="text-green-400" />
                <div className="border-t border-gray-700 pt-4">
                  <StatRow label="Tiempo promedio" value={`${avgTime} min`} valueColor="text-orange-400" />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">ÚLTIMOS COMPLETADOS</h3>
              {completedOrders.length > 0 ? (
                <div className="space-y-2">
                  {completedOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar name={order.customer} size="sm" />
                        <span className="text-gray-300">#{order.id} - {order.customer}</span>
                      </div>
                      <CheckCircle size={14} className="text-green-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Sin pedidos completados</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function KDSOrderCard({ order, onComplete }: { order: KDSOrder; onComplete: () => void }) {
  const isLate = order.elapsedMinutes > 30

  return (
    <Card
      className={`${isLate || order.priority ? 'bg-red-900/30 border-red-500' : 'bg-gray-800 border-gray-700'} border-2`}
      padding="md"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">#{order.id}</span>
          <Avatar name={order.customer} size="md" />
        </div>
        <span className={`text-sm font-medium ${isLate ? 'text-red-400' : 'text-gray-400'}`}>
          Hace {order.elapsedMinutes} min
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              {item.quantity}x
            </span>
            <span className="text-gray-200">{item.name}</span>
          </div>
        ))}
      </div>

      <Button variant="success" fullWidth onClick={onComplete}>
        TERMINAR
      </Button>
    </Card>
  )
}

function StatRow({ label, value, valueColor = 'text-white' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
    </div>
  )
}

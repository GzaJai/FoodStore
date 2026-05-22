import { useState } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useOrderStore } from '../stores/orderStore'
import { MetricCard, Card, CardHeader, CardTitle, CardContent, Button, DonutChart, OrderCard } from '../components/ui'
import {
  ShoppingBag,
  CheckCircle,
  Truck,
  Calendar,
  BarChart3,
  Package,
  Users,
  Download,
  Monitor,
  Store,
} from 'lucide-react'

const categoryData = [
  { name: 'Almuerzos', value: 25, color: '#f97316' },
  { name: 'Sandwiches', value: 15.6, color: '#3b82f6' },
  { name: 'Pizzas', value: 8.3, color: '#8b5cf6' },
  { name: 'Desayunos', value: 8.3, color: '#10b981' },
  { name: 'Otros', value: 42.8, color: '#6b7280' },
]

const quickActions = [
  { label: 'Pantallas', icon: Monitor, view: 'kds' as const },
  { label: 'Pedidos', icon: ShoppingBag, view: 'orders' as const },
  { label: 'Productos', icon: Package, view: 'dashboard' as const },
  { label: 'Clientes', icon: Users, view: 'client-logos' as const },
  { label: 'Exportar', icon: Download, view: 'dashboard' as const },
]

export default function Dashboard() {
  const { setCurrentView } = useUIStore()
  const { orders, updateStatus } = useOrderStore()
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  const openOrders = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status))

  const actionLabels: Record<string, string> = {
    pending: 'Preparar',
    preparing: 'Listo',
    ready: 'Enviar',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Ventas Hoy" value="$43.570" change="-8.4%" trend="down" icon={<span className="text-2xl">$</span>} />
        <MetricCard title="Pedidos Hoy" value="7" change="+14.2%" trend="up" icon={<ShoppingBag size={24} />} />
        <MetricCard title="Entregados" value="60" icon={<CheckCircle size={24} />} />
        <MetricCard title="Retiros / Delivery" value="2 / 4" icon={<Truck size={24} />} />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-500" />
                Ranking Categorías
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={categoryData} />
          </CardContent>
        </Card>

        {/* Pedidos abiertos */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-500" />
                Pedidos Abiertos
              </span>
            </CardTitle>
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
              {openOrders.length}
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showAction
                  actionLabel={actionLabels[order.status]}
                  onAction={(id) => {
                    const next: Record<string, string> = { pending: 'preparing', preparing: 'ready', ready: 'sent' }
                    updateStatus(id, next[order.status] as never)
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.label}
                    variant="secondary"
                    fullWidth
                    className="flex-col h-auto py-4 gap-2"
                    onClick={() => setCurrentView(action.view)}
                  >
                    <Icon size={24} />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                )
              })}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Store size={18} className="text-orange-500" />
                <span className="font-medium text-orange-800 text-sm">FoodStore</span>
              </div>
              <p className="text-xs text-orange-600">Local activo • Sistema operativo normal</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrderStore, type Order } from '../../stores/orderStore'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useUIStore } from '../../stores/uiStore'
import { OrderDetailModal } from '../orders/components/OrderDetailModal'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../shared/ui'
import { MetricCard } from './components/MetricCard'
import { DonutChart } from './components/DonutChart'
import { OrderCard } from '../orders/components/OrderCard'
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

const quickActions = [
  { label: 'Cocina', icon: Monitor, path: '/negocio/cocina' },
  { label: 'Pedidos', icon: ShoppingBag, path: '/negocio/pedidos' },
  { label: 'Productos', icon: Package, path: '/negocio/productos' },
  { label: 'Categorías', icon: Package, path: '/negocio/categorias' },
  { label: 'Clientes', icon: Users, path: '/negocio/clientes' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, updateStatus } = useOrderStore()
  const { metrics, fetchMetrics, fetchOpenOrders } = useDashboardStore()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useUIStore((s) => s.tick)

  useEffect(() => {
    fetchMetrics(selectedDate)
    fetchOpenOrders()
  }, [fetchMetrics, fetchOpenOrders, selectedDate])

  const openOrders = orders
    .filter((o) => ['pending', 'preparing', 'ready'].includes(o.status))
    .sort((a, b) => {
      if (a.status === 'ready' && b.status !== 'ready') return -1
      if (b.status === 'ready' && a.status !== 'ready') return 1
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

  const salesChange = metrics?.previousDay?.salesChange
  const salesTrend = salesChange != null ? (salesChange >= 0 ? 'up' as const : 'down' as const) : 'neutral' as const
  const salesChangeText = salesChange != null ? `${salesChange >= 0 ? '+' : ''}${salesChange}%` : undefined

  const ordersChange = metrics?.previousDay?.ordersChange
  const ordersTrend = ordersChange != null ? (ordersChange >= 0 ? 'up' as const : 'down' as const) : 'neutral' as const
  const ordersChangeText = ordersChange != null ? `${ordersChange >= 0 ? '+' : ''}${ordersChange}%` : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-black" />
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas Hoy"
          value={metrics ? formatCurrency(metrics.totalSales) : '$0'}
          change={salesChangeText}
          trend={salesTrend}
          icon={<span className="text-2xl">$</span>}
        />
        <MetricCard
          title="Pedidos Hoy"
          value={metrics ? String(metrics.totalOrders) : '0'}
          change={ordersChangeText}
          trend={ordersTrend}
          icon={<ShoppingBag size={24} />}
        />
        <MetricCard
          title="Entregados (Acum.)"
          value={metrics ? String(metrics.deliveredOrders) : '0'}
          icon={<CheckCircle size={24} />}
        />
        <MetricCard
          title="Retiros / Delivery"
          value={metrics ? `${metrics.takeawayCount} / ${metrics.deliveryCount}` : '0 / 0'}
          icon={<Truck size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            {metrics && metrics.categoryBreakdown.length > 0 ? (
              <DonutChart data={metrics.categoryBreakdown} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos de categorías</p>
            )}
          </CardContent>
        </Card>

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
              {openOrders.length > 0 ? (
                openOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showAction={order.status === 'ready'}
                    actionLabel={order.status === 'ready' ? (order.channel === 'delivery' ? 'Enviar' : 'Facturar') : ''}
                    onAction={order.status === 'ready' ? (id) => {
                      const next = order.channel === 'delivery' ? 'sent' as const : 'billed' as const
                      updateStatus(id, next)
                    } : undefined}
                    onViewDetail={(order) => {
                      setDetailOrder(order)
                      setIsDetailOpen(true)
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No hay pedidos abiertos</p>
              )}
            </div>
          </CardContent>
        </Card>

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
                    onClick={() => navigate(action.path)}
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

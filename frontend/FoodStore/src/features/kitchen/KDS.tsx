import { useState, useEffect, useCallback } from 'react'
import { useOrderStore } from '../../stores/orderStore'
import type { Order } from '../../stores/orderStore'
import { Card, Avatar, Button, EmptyState } from '../shared/ui'
import { Maximize2, Minimize2, CheckCircle, ChefHat, CookingPot, Sun, Moon } from 'lucide-react'
import { KDSOrderCard } from './components/KDSOrderCard'
import type { KDSOrder } from './components/KDSOrderCard'

function mapToKDSOrder(o: Order): KDSOrder {
  return {
    id: o.id,
    customer: o.customer,
    notes: o.notes,
    items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, notes: i.notes ?? null })),
    createdAt: o.createdAt,
    elapsedMinutes: Math.floor((Date.now() - o.createdAt.getTime()) / 60000),
  }
}

export default function KDS() {
  const { orders, updateStatus, fetchOrders } = useOrderStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
    }
  }, [])

  const byOldestFirst = (a: KDSOrder, b: KDSOrder) => a.createdAt.getTime() - b.createdAt.getTime()

  const entrantes: KDSOrder[] = orders
    .filter((o) => o.status === 'pending')
    .map(mapToKDSOrder)
    .sort(byOldestFirst)

  const enCocina: KDSOrder[] = orders
    .filter((o) => o.status === 'preparing')
    .map(mapToKDSOrder)
    .sort(byOldestFirst)

  const totalEnCocina = entrantes.length + enCocina.length
  const avgTime = totalEnCocina > 0
    ? Math.round(
        [...entrantes, ...enCocina].reduce((acc, o) => acc + o.elapsedMinutes, 0) / totalEnCocina
      )
    : 0

  const completedOrders = orders.filter((o) => o.status === 'ready').slice(0, 5)

  const FullscreenIcon = isFullscreen ? Minimize2 : Maximize2
  const ThemeIcon = isDark ? Sun : Moon

  const containerClass = isDark
    ? 'flex flex-col bg-gray-900 text-white'
    : 'flex flex-col bg-gray-50 text-gray-800'

  const fullscreenClass = isFullscreen ? 'h-screen fixed inset-0 z-50' : 'h-[calc(100vh-72px)]'

  const headerClass = isDark
    ? 'bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700 shrink-0'
    : 'bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm shrink-0'

  const clockClass = isDark
    ? 'text-3xl font-mono font-bold text-white'
    : 'text-3xl font-mono font-bold text-gray-800'

  const sectionIconClass = (color: 'yellow' | 'blue') => {
    if (isDark) return color === 'yellow' ? 'text-yellow-400' : 'text-blue-400'
    return color === 'yellow' ? 'text-amber-600' : 'text-blue-600'
  }

  const sectionTitleClass = (color: 'yellow' | 'blue') => {
    if (isDark) return color === 'yellow' ? 'text-lg font-semibold text-yellow-400' : 'text-lg font-semibold text-blue-400'
    return color === 'yellow' ? 'text-lg font-semibold text-amber-700' : 'text-lg font-semibold text-blue-700'
  }

  const summaryCardClass = isDark
    ? '!bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200 shadow-sm'

  const emptyStateClass = isDark ? 'py-12 text-gray-400' : 'py-12 text-gray-500'

  return (
    <div className={`${containerClass} ${fullscreenClass}`}>
      <div className={headerClass}>
        <div className="flex items-center gap-6">
          <h1 className={`text-xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            FoodStore KDS
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className={clockClass}>
            {currentTime.toLocaleTimeString('es-AR')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark((d) => !d)}
            className={`transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400 hover:text-yellow-400'
                : 'hover:bg-gray-100 text-gray-500 hover:text-amber-500'
            }`}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            <ThemeIcon size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className={`transition-colors ${
              isDark
                ? 'hover:bg-gray-700 hover:text-white text-gray-400'
                : 'hover:bg-gray-100 hover:text-black text-gray-500'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            <FullscreenIcon size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="flex gap-4 h-full">
          <div className="w-2/5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat size={20} className={sectionIconClass('yellow')} />
              <h2 className={sectionTitleClass('yellow')}>
                ENTRANTES ({entrantes.length})
              </h2>
            </div>
            <div className="flex-1 space-y-3 overflow-auto">
              {entrantes.length > 0 ? (
                entrantes.map((order) => (
                  <KDSOrderCard
                    key={order.id}
                    order={order}
                    actionLabel="Preparar"
                    actionVariant="primary"
                    onAction={() => updateStatus(order.id, 'preparing')}
                    isDark={isDark}
                  />
                ))
              ) : (
                <EmptyState icon={ChefHat} title="Sin entrantes" className={emptyStateClass} />
              )}
            </div>
          </div>

          <div className="w-2/5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <CookingPot size={20} className={sectionIconClass('blue')} />
              <h2 className={sectionTitleClass('blue')}>
                EN COCINA ({enCocina.length})
              </h2>
            </div>
            <div className="flex-1 space-y-3 overflow-auto">
              {enCocina.length > 0 ? (
                enCocina.map((order) => (
                  <KDSOrderCard
                    key={order.id}
                    order={order}
                    actionLabel="Terminar"
                    actionVariant="success"
                    onAction={() => updateStatus(order.id, 'ready')}
                    isDark={isDark}
                  />
                ))
              ) : (
                <EmptyState icon={CookingPot} title="Sin pedidos en cocina" className={emptyStateClass} />
              )}
            </div>
          </div>

          <div className="w-1/5 flex flex-col gap-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RESUMEN</h2>
            <Card className={summaryCardClass}>
              <div className="space-y-4">
                <StatRow
                  label="Entrantes"
                  value={entrantes.length.toString()}
                  valueColor={isDark ? 'text-yellow-400' : 'text-amber-600'}
                  isDark={isDark}
                />
                <StatRow
                  label="En cocina"
                  value={enCocina.length.toString()}
                  valueColor={isDark ? 'text-blue-400' : 'text-blue-600'}
                  isDark={isDark}
                />
                <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <StatRow
                    label="Tiempo promedio"
                    value={`${avgTime} min`}
                    valueColor={isDark ? 'text-orange-400' : 'text-orange-600'}
                    isDark={isDark}
                  />
                </div>
              </div>
            </Card>

            <Card className={summaryCardClass}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ÚLTIMOS COMPLETADOS</h3>
              {completedOrders.length > 0 ? (
                <div className="space-y-2">
                  {completedOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar name={order.customer} size="sm" />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                          #{order.id} - {order.customer}
                        </span>
                      </div>
                      <CheckCircle size={14} className={isDark ? 'text-green-400' : 'text-green-600'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Sin pedidos completados
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  valueColor = 'text-white',
  isDark = true,
}: {
  label: string
  value: string
  valueColor?: string
  isDark?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
      <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { ChevronLeft, User, Mail, Phone, LogOut, ShoppingBag, UtensilsCrossed, Bike, Package, Clock, Loader2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { getMyOrdersApi } from '../../../api/public'
import { mapOrder } from '../../../api/mappers'
import type { Order } from '../../../stores/orderStore'
import { formatPrice } from '../constants'

interface AccountViewProps {
  onBack: () => void
  onLogout: () => void
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  ready: 'Listo',
  sent: 'Enviado',
  billed: 'Facturado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  sent: 'bg-purple-100 text-purple-800',
  billed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

function ChannelIcon({ channel }: { channel: Order['channel'] }) {
  if (channel === 'delivery') return <Bike size={14} />
  if (channel === 'table') return <UtensilsCrossed size={14} />
  return <ShoppingBag size={14} />
}

const CHANNEL_LABELS: Record<string, string> = {
  delivery: 'Delivery',
  table: 'Mesa',
  takeaway: 'Take Away',
}

export function AccountView({ onBack, onLogout }: AccountViewProps) {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = async (p: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getMyOrdersApi({ page: p, per_page: 10 })
      if (p === 1) {
        setOrders(res.items.map(mapOrder))
      } else {
        setOrders((prev) => [...prev, ...res.items.map(mapOrder)])
      }
      setTotalPages(res.meta.total_pages)
      setPage(p)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el historial'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(1)
  }, [])

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hoy ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col">
      <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-headline-lg-mobile font-headline">Mi cuenta</h1>
      </header>

      <div className="flex-1 overflow-auto">
        {/* Perfil */}
        <div className="p-6 pb-4">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-4xl mb-3 shadow-lg border-4 border-primary/20">
              <User size={40} />
            </div>
            <p className="text-xl font-bold">{user?.name || 'Cliente'}</p>
            {user?.role === 'customer' && (
              <span className="text-xs text-primary font-medium mt-1 px-3 py-0.5 bg-primary/10 rounded-full">
                Cliente
              </span>
            )}
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center gap-3">
              <Mail size={16} className="text-primary shrink-0" />
              <div>
                <p className="text-xs text-on-surface-variant">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center gap-3">
                <Phone size={16} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs text-on-surface-variant">Teléfono</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historial de pedidos */}
        <div className="px-6 pb-4">
          <h2 className="text-title-md font-title text-on-surface mb-3 flex items-center gap-2">
            <Package size={18} className="text-primary" />
            Mis pedidos
          </h2>

          {isLoading && page === 1 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-body-sm">Cargando pedidos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm font-bold text-red-700 mb-1">Error</p>
                <p className="text-body-sm text-red-600">{error}</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <Package size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-body-lg font-medium">Todavía no hiciste pedidos</p>
              <p className="text-body-sm mt-1">Los pedidos que hagas aparecerán acá</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow space-y-2"
                >
                  {/* Header: order number + status */}
                  <div className="flex items-center justify-between">
                    <p className="text-title-md font-bold text-on-surface">#{order.orderNumber}</p>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <p className="text-body-sm text-on-surface-variant">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  {/* Footer: channel + date + total */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <ChannelIcon channel={order.channel} />
                        {CHANNEL_LABELS[order.channel] || order.channel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(new Date(order.createdAt))}
                      </span>
                    </div>
                    <span className="font-bold text-on-surface text-body-sm">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {page < totalPages && (
                <button
                  onClick={() => fetchOrders(page + 1)}
                  disabled={isLoading}
                  className="w-full py-3 text-body-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Cargando...' : 'Ver más pedidos'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
        <div className="px-6 pb-8 max-w-md mx-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

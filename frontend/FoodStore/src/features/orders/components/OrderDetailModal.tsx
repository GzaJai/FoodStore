import { useState } from 'react'
import { Modal, Button, Select, ConfirmModal } from '../../shared/ui'
import { useOrderStore, type OrderStatus } from '../../../stores/orderStore'
import { useAuthStore } from '../../../stores/authStore'
import type { Order } from '../../../stores/orderStore'
import { Phone, FileText, Package, ArrowLeftRight } from 'lucide-react'

interface OrderDetailModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
  sent: 'Enviado',
  billed: 'Facturado',
  cancelled: 'Cancelado',
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready', 'sent', 'billed', 'cancelled']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

const CHANNEL_LABEL: Record<string, string> = {
  delivery: 'Delivery',
  table: 'Mesa',
  takeaway: 'Take Away',
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  const { user } = useAuthStore()
  const { updateStatus } = useOrderStore()
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  if (!order) return null

  const isAdmin = user?.role === 'admin'
  const availableStatuses = ALL_STATUSES.filter((s) => s !== order.status)

  const handleModalClose = () => {
    if (isChangingStatus) {
      setIsChangingStatus(false)
      setSelectedStatus('')
    } else {
      onClose()
    }
  }

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus) return
    setIsUpdating(true)
    try {
      await updateStatus(order.id, selectedStatus as OrderStatus)
      setShowConfirm(false)
      setIsChangingStatus(false)
      setSelectedStatus('')
      onClose()
    } catch {
      // Error handled by store (re-fetches)
    } finally {
      setIsUpdating(false)
    }
  }

  const modalTitle = isChangingStatus
    ? `Cambiar estado - Pedido #${order.id}`
    : `Pedido #${order.id}`

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title={modalTitle}
        size="lg"
        closeOnOverlay={!isChangingStatus}
        footer={
          isChangingStatus ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsChangingStatus(false)
                  setSelectedStatus('')
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowConfirm(true)}
                disabled={!selectedStatus}
              >
                Confirmar cambio
              </Button>
            </>
          ) : isAdmin ? (
            <Button variant="outline" onClick={() => setIsChangingStatus(true)} leftIcon={<ArrowLeftRight size={14} />}>
              Cambiar estado
            </Button>
          ) : undefined
        }
      >
        {isChangingStatus ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Seleccioná el nuevo estado para el pedido <strong>#{order.id}</strong>:
            </p>
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Estado actual</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                order.status === 'pending' ? 'bg-red-100 text-red-700' :
                order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                order.status === 'ready' ? 'bg-green-100 text-green-700' :
                order.status === 'sent' ? 'bg-purple-100 text-purple-700' :
                order.status === 'billed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <Select
              options={availableStatuses.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
              placeholder="Seleccionar nuevo estado"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">N° de Pedido</p>
                  <p className="text-lg font-bold text-gray-800 font-mono">{order.orderNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    order.channel === 'delivery' ? 'bg-blue-100 text-blue-700' :
                    order.channel === 'table' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {CHANNEL_LABEL[order.channel]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    order.status === 'pending' ? 'bg-red-100 text-red-700' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'ready' ? 'bg-green-100 text-green-700' :
                    order.status === 'sent' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'billed' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Cliente</p>
                  <p className="text-base font-semibold text-gray-800">{order.customer}</p>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Package size={14} /> Productos ({order.items.length})
              </p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shrink-0">
                        {item.quantity}x
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-400 truncate">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 shrink-0 ml-3">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>IVA (21%)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-800 border-t border-gray-100 pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {order.notes && (
              <>
                <hr className="border-gray-100" />
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FileText size={14} className="mt-0.5 shrink-0" />
                  <p className="text-gray-500 italic">{order.notes}</p>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirmar cambio de estado"
        message={`¿Estás seguro de cambiar el estado del pedido #${order.id} de "${STATUS_LABEL[order.status]}" a "${STATUS_LABEL[selectedStatus]}"?`}
        confirmLabel="Sí, cambiar"
        onConfirm={handleConfirmStatusChange}
        variant="primary"
        isLoading={isUpdating}
      />
    </>
  )
}

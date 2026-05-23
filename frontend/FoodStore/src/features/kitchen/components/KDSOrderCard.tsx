import { Card } from '../../shared/ui/Card'
import { Avatar } from '../../shared/ui/Avatar'
import { Button } from '../../shared/ui/Button'
import { MessageSquareText, MessageSquareOff } from 'lucide-react'

export interface KDSOrderItem {
  name: string
  quantity: number
  notes: string | null
}

export interface KDSOrder {
  id: number
  customer: string
  notes: string | null
  items: KDSOrderItem[]
  createdAt: Date
  elapsedMinutes: number
}

export function formatElapsed(createdAt: Date): string {
  const min = Math.floor((Date.now() - createdAt.getTime()) / 60000)
  if (min < 1) return '~ 1 min'
  return `${min} min`
}

export function KDSOrderCard({
  order,
  actionLabel,
  actionVariant,
  onAction,
  isDark = true,
}: {
  order: KDSOrder
  actionLabel: string
  actionVariant: 'primary' | 'success'
  onAction: () => void
  isDark?: boolean
}) {
  const hasNotes = order.notes !== null && order.notes !== ''
  const hasItemNotes = order.items.some((i) => i.notes !== null && i.notes !== '')

  const cardClass = isDark
    ? '!bg-gray-800 border-gray-700 border-2'
    : 'bg-white border-gray-200 border shadow-sm'

  const idClass = isDark ? 'text-2xl font-bold text-white shrink-0' : 'text-2xl font-bold text-gray-900 shrink-0'
  const customerClass = isDark ? 'text-base font-medium text-gray-200 truncate' : 'text-base font-medium text-gray-700 truncate'
  const elapsedClass = isDark ? 'text-sm font-medium text-gray-400 shrink-0' : 'text-sm font-medium text-gray-500 shrink-0'

  const itemBg = isDark ? 'flex mb-1 items-center gap-2 text-sm bg-white/10 rounded-lg' : 'flex mb-1 items-center gap-2 text-sm bg-gray-100 rounded-lg'
  const itemText = isDark ? 'text-white text-lg' : 'text-gray-800 text-lg'
  const itemQtyText = isDark ? 'text-white text-lg font-bold px-2 py-0.5 rounded shrink-0' : 'text-gray-800 text-lg font-bold px-2 py-0.5 rounded shrink-0'
  const itemNoteClass = isDark ? 'text-xs text-yellow-400/80 mt-1 ml-8 italic' : 'text-xs text-amber-700/80 mt-1 ml-8 italic'

  const notesBoxClass = isDark
    ? 'flex items-start gap-2 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2'
    : 'flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'
  const notesIconClass = isDark ? 'text-yellow-400 mt-0.5 shrink-0' : 'text-amber-600 mt-0.5 shrink-0'
  const notesTextClass = isDark ? 'text-yellow-300/90' : 'text-amber-800'

  const noNotesClass = isDark
    ? 'flex items-center gap-2 text-gray-600'
    : 'flex items-center gap-2 text-gray-400'

  return (
    <Card className={cardClass} padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={idClass}>#{order.id}</span>
          <Avatar name={order.customer} size="md" />
          <span className={customerClass}>{order.customer}</span>
        </div>
        <span className={elapsedClass}>
          {formatElapsed(order.createdAt)}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx}>
            <div className={itemBg}>
              <span className={itemQtyText}>
                {item.quantity} X
              </span>
              <span className={itemText}>{item.name}</span>
            </div>
            {item.notes && (
              <p className={itemNoteClass}>
                Nota: {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mb-4">
        {hasNotes ? (
          <div className={notesBoxClass}>
            <MessageSquareText size={14} className={notesIconClass} />
            <p className={notesTextClass}>{order.notes}</p>
          </div>
        ) : !hasItemNotes ? (
          <div className={noNotesClass}>
            <MessageSquareOff size={12} />
            <span>Sin notas</span>
          </div>
        ) : null}
      </div>

      <Button variant={actionVariant} fullWidth onClick={onAction}>
        {actionLabel}
      </Button>
    </Card>
  )
}

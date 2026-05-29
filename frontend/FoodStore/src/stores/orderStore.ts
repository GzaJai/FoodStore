import { create } from 'zustand'
import { listOrdersApi, updateOrderStatusApi } from '../api/orders'
import { mapOrder } from '../api/mappers'

const STATUS_REVERSE: Record<string, 'PENDING' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'SENT' | 'BILLED' | 'CANCELLED'> = {
  pending: 'PENDING',
  preparing: 'PREPARING',
  ready: 'READY',
  out_for_delivery: 'OUT_FOR_DELIVERY',
  sent: 'SENT',
  billed: 'BILLED',
  cancelled: 'CANCELLED',
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'sent' | 'billed' | 'cancelled'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  extras?: string[]
  notes?: string | null
}

export interface Order {
  id: number
  orderNumber: string
  customer: string
  customerPhone: string | null
  items: OrderItem[]
  status: OrderStatus
  channel: 'delivery' | 'table' | 'takeaway'
  subtotal: number
  tax: number
  total: number
  notes: string | null
  createdAt: Date
  priority?: boolean
  address: string | null
  assignedToId: string | null
  assignedToName: string | null
}

interface OrderState {
  orders: Order[]
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void
  updateStatus: (id: number, status: OrderStatus) => Promise<void>
  getOrdersByStatus: (status: OrderStatus) => Order[]
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const apiOrders = await listOrdersApi()
      set({
        orders: apiOrders.map(mapOrder),
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error al cargar pedidos',
      })
    }
  },

  addOrder: (order) =>
    set((state) => ({
      orders: [
        ...state.orders,
        { ...order, id: Math.max(...state.orders.map((o) => o.id), 0) + 1, createdAt: new Date() },
      ],
    })),

  updateStatus: async (id, status) => {
    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }))

    try {
      await updateOrderStatusApi(id, STATUS_REVERSE[status] as 'PENDING' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'SENT' | 'BILLED' | 'CANCELLED')
    } catch {
      // Revert on error — refetch
      await get().fetchOrders()
    }
  },

  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),
}))

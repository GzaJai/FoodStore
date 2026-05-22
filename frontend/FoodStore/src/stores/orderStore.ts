import { create } from 'zustand'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'sent' | 'billed' | 'cancelled'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  extras?: string[]
}

export interface Order {
  id: number
  customer: string
  items: OrderItem[]
  status: OrderStatus
  channel: 'delivery' | 'table' | 'takeaway'
  createdAt: Date
  priority?: boolean
}

interface OrderState {
  orders: Order[]
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void
  updateStatus: (id: number, status: OrderStatus) => void
  getOrdersByStatus: (status: OrderStatus) => Order[]
}

const initialOrders: Order[] = [
  {
    id: 99,
    customer: 'mayra galarza',
    items: [{ id: '1', name: 'Hamburguesa Clásica', quantity: 1 }],
    status: 'pending',
    channel: 'delivery',
    createdAt: new Date(),
  },
  {
    id: 98,
    customer: 'maría lópez',
    items: [
      { id: '2', name: 'Pizza Mozzarella', quantity: 1 },
      { id: '3', name: 'Faina', quantity: 2 },
    ],
    status: 'pending',
    channel: 'table',
    createdAt: new Date(),
  },
  {
    id: 95,
    customer: 'ezequiel hammel',
    items: [{ id: '4', name: 'Milanesa Napolitana', quantity: 1, extras: ['Papas fritas'] }],
    status: 'preparing',
    channel: 'table',
    createdAt: new Date(),
  },
  {
    id: 93,
    customer: 'nico usuriaga',
    items: [{ id: '5', name: 'Empanadas x6', quantity: 1 }],
    status: 'ready',
    channel: 'takeaway',
    createdAt: new Date(),
  },
  {
    id: 91,
    customer: 'sofia depetris',
    items: [{ id: '6', name: 'Ensalada César', quantity: 1 }],
    status: 'sent',
    channel: 'delivery',
    createdAt: new Date(),
  },
  {
    id: 90,
    customer: 'fiorella godoy',
    items: [{ id: '7', name: 'Pasta Bolognesa', quantity: 1 }],
    status: 'billed',
    channel: 'table',
    createdAt: new Date(),
  },
  {
    id: 86,
    customer: 'mauro campos',
    items: [{ id: '8', name: 'Coca cola', quantity: 2 }],
    status: 'cancelled',
    channel: 'delivery',
    createdAt: new Date(),
  },
]

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: initialOrders,
  addOrder: (order) =>
    set((state) => ({
      orders: [
        ...state.orders,
        { ...order, id: Math.max(...state.orders.map((o) => o.id)) + 1, createdAt: new Date() },
      ],
    })),
  updateStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),
}))

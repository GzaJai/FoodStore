// ==========================================
// Mappers entre tipos de la API Backend y tipos del Frontend
// ==========================================

import type {
  ApiOrderResponse,
  ApiOrderStatus,
  ApiOrderChannel,
  ApiUserRole,
  ApiUserResponse,
  ApiDashboardMetrics,
  ApiClientCategoryResponse,
} from '../types/api'

import type { Order, OrderStatus, OrderItem } from '../stores/orderStore'
import type { User } from '../stores/authStore'

// ─── Status ───────────────────────────────────────────

const STATUS_MAP: Record<ApiOrderStatus, OrderStatus> = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  SENT: 'sent',
  BILLED: 'billed',
  CANCELLED: 'cancelled',
}

const STATUS_REVERSE: Record<string, ApiOrderStatus> = {
  pending: 'PENDING',
  preparing: 'PREPARING',
  ready: 'READY',
  out_for_delivery: 'OUT_FOR_DELIVERY',
  sent: 'SENT',
  billed: 'BILLED',
  cancelled: 'CANCELLED',
}

export function mapStatus(apiStatus: ApiOrderStatus): OrderStatus {
  return STATUS_MAP[apiStatus] ?? 'pending'
}

export function mapStatusReverse(status: OrderStatus): ApiOrderStatus {
  return STATUS_REVERSE[status] ?? 'PENDING'
}

// ─── Channel ──────────────────────────────────────────

const CHANNEL_MAP: Record<ApiOrderChannel, Order['channel']> = {
  DELIVERY: 'delivery',
  TABLE: 'table',
  TAKEAWAY: 'takeaway',
}

export function mapChannel(apiChannel: ApiOrderChannel): Order['channel'] {
  return CHANNEL_MAP[apiChannel] ?? 'delivery'
}

// ─── User Role ────────────────────────────────────────

const ROLE_MAP: Record<ApiUserRole, User['role']> = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  COOK: 'cook',
  CASHIER: 'cashier',
  DELIVERY: 'delivery',
  CUSTOMER: 'customer',
}

export function mapRole(apiRole: ApiUserRole): User['role'] {
  return ROLE_MAP[apiRole] ?? 'cashier'
}

// ─── Order Items ──────────────────────────────────────

export function mapOrderItem(item: ApiOrderResponse['items'][number]): OrderItem {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    extras: item.extras,
    notes: item.notes,
  }
}

// ─── Order ────────────────────────────────────────────

export function mapOrder(apiOrder: ApiOrderResponse): Order {
  return {
    id: apiOrder.id,
    orderNumber: apiOrder.order_number,
    customer: apiOrder.customer_name,
    customerPhone: apiOrder.customer_phone,
    items: apiOrder.items.map(mapOrderItem),
    status: mapStatus(apiOrder.status),
    channel: mapChannel(apiOrder.channel),
    subtotal: apiOrder.subtotal,
    tax: apiOrder.tax,
    total: apiOrder.total,
    notes: apiOrder.notes,
    // La API devuelve datetime sin timezone (UTC implícito). Si no tiene Z ni offset, se lo agregamos.
    createdAt: new Date(apiOrder.created_at + (/(Z|[+-]\d{2}:?\d{2})$/.test(apiOrder.created_at) ? '' : 'Z')),
    priority: apiOrder.priority,
    address: apiOrder.address,
    assignedToId: apiOrder.assigned_to_id,
    assignedToName: apiOrder.assigned_to_name,
  }
}

// ─── User ─────────────────────────────────────────────

export function mapUser(apiUser: ApiUserResponse): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone ?? '',
    role: mapRole(apiUser.role),
    avatar: apiUser.avatar ?? undefined,
  }
}

// ─── Dashboard Metrics ────────────────────────────────

export interface DashboardData {
  totalSales: number
  totalOrders: number
  deliveredOrders: number
  takeawayCount: number
  deliveryCount: number
  categoryBreakdown: { name: string; value: number; color: string }[]
  previousDay: {
    totalSales: number
    totalOrders: number
    salesChange: number
    ordersChange: number
  } | null
}

export function mapDashboardMetrics(api: ApiDashboardMetrics): DashboardData {
  return {
    totalSales: api.total_sales,
    totalOrders: api.total_orders,
    deliveredOrders: api.delivered_orders,
    takeawayCount: api.takeaway_count,
    deliveryCount: api.delivery_count,
    categoryBreakdown: api.category_breakdown.map((c) => ({
      name: c.name,
      value: c.value,
      color: c.color,
    })),
    previousDay: api.previous_day
      ? {
          totalSales: api.previous_day.total_sales,
          totalOrders: api.previous_day.total_orders,
          salesChange: api.previous_day.sales_change,
          ordersChange: api.previous_day.orders_change,
        }
      : null,
  }
}

// ─── Client Categories ────────────────────────────────

export interface ClientCategoryData {
  id: string
  key: string
  name: string
  icon: string | null
  logo: string | null
  color: string | null
  isActive: boolean
  sortOrder: number
  clientCount: number
}

export function mapClientCategory(api: ApiClientCategoryResponse): ClientCategoryData {
  return {
    id: api.id,
    key: api.key,
    name: api.name,
    icon: api.icon,
    logo: api.logo,
    color: api.color,
    isActive: api.is_active,
    sortOrder: api.sort_order,
    clientCount: api.client_count,
  }
}

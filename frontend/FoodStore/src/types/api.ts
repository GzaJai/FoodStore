// ==========================================
// Tipos de la API del backend (FastAPI → FoodStore)
// ==========================================

// --- Auth ---
export interface ApiLoginRequest {
  email: string
  password: string
}

export interface ApiLoginResponse {
  token: string
  user: ApiUserResponse
}

// --- Users ---
export type ApiUserRole = 'ADMIN' | 'MANAGER' | 'COOK' | 'CASHIER'

export interface ApiUserResponse {
  id: string
  name: string
  email: string
  phone: string | null
  role: ApiUserRole
  avatar: string | null
  is_active: boolean
  last_login_at: string | null
}

export interface ApiUserUpdate {
  name?: string
  phone?: string
}

export interface ApiPasswordChange {
  current_password: string
  new_password: string
}

// --- Ingredients ---
export interface ApiIngredientResponse {
  id: string
  name: string
  is_allergen: boolean
}

export interface ApiIngredientCreate {
  name: string
  is_allergen?: boolean
}

export interface ApiIngredientUpdate {
  name?: string
  is_allergen?: boolean
}

// --- Products ---
export interface ApiProductResponse {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string
  category: string
  category_name: string
  is_active: boolean
  image: string | null
  prep_time_min: number | null
  ingredients: ApiIngredientResponse[]
}

export interface ApiProductCreate {
  name: string
  description?: string
  price: number
  category_id: string
  prep_time_min?: number
  ingredient_ids?: string[]
}

export interface ApiProductUpdate {
  name?: string
  description?: string
  price?: number
  category_id?: string
  is_active?: boolean
  prep_time_min?: number
  ingredient_ids?: string[]
}

// --- Product Categories ---
export interface ApiProductCategoryResponse {
  id: string
  name: string
  key: string
  color: string | null
  parent_id: string | null
  is_active: boolean
  product_count: number
}

export interface ApiProductCategoryCreate {
  name: string
  key: string
  color?: string
  parent_id?: string | null
}

export interface ApiProductCategoryUpdate {
  name?: string
  color?: string
  parent_id?: string | null
  is_active?: boolean
}

// --- Orders ---
export type ApiOrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'SENT'
  | 'BILLED'
  | 'CANCELLED'

export type ApiOrderChannel = 'DELIVERY' | 'TABLE' | 'TAKEAWAY'

export interface ApiOrderItemResponse {
  id: string
  product_id: string
  name: string
  quantity: number
  unit_price: number
  extras: string[]
  notes: string | null
}

export interface ApiOrderResponse {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  table_number: number | null
  status: ApiOrderStatus
  channel: ApiOrderChannel
  priority: boolean
  notes: string | null
  subtotal: number
  tax: number
  total: number
  created_at: string
  updated_at: string
  items: ApiOrderItemResponse[]
}

export interface ApiOrderCreate {
  customer_name: string
  customer_phone?: string
  customer_email?: string
  table_number?: number
  channel: ApiOrderChannel
  priority?: boolean
  notes?: string
  items: ApiOrderItemCreate[]
}

export interface ApiOrderItemCreate {
  product_id: string
  quantity: number
  extras?: string[]
  notes?: string
}

export interface ApiOrderStatusUpdate {
  status: ApiOrderStatus
}

// --- Client Categories ---
export interface ApiClientCategoryResponse {
  id: string
  key: string
  name: string
  icon: string | null
  logo: string | null
  color: string | null
  is_active: boolean
  sort_order: number
  client_count: number
}

// --- Dashboard ---
export interface ApiCategoryBreakdown {
  name: string
  value: number
  color: string
}

export interface ApiPreviousDayMetrics {
  total_sales: number
  total_orders: number
  sales_change: number
  orders_change: number
}

export interface ApiDashboardMetrics {
  date: string
  total_sales: number
  total_orders: number
  delivered_orders: number
  takeaway_count: number
  delivery_count: number
  category_breakdown: ApiCategoryBreakdown[]
  previous_day: ApiPreviousDayMetrics | null
}

// --- Generic ---
export interface ApiMessageResponse {
  success: boolean
  message: string
}

// --- Pagination ---
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ProductPage {
  items: ApiProductResponse[]
  meta: PaginationMeta
}

export interface PreferenceResponse {
  init_point: string
  preference_id: string
  order_id: number
  order_number: string
}

export interface PaymentResponse {
  status: string
  status_detail: string | null
  mp_payment_id: number | null
  order_id: number
  order_number: string
}

export interface IngredientPage {
  items: ApiIngredientResponse[]
  meta: PaginationMeta
}

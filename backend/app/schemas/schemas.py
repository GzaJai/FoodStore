from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.models.models import UserRole, OrderStatus, OrderChannel, ProductCategory


# ==========================================
# AUTH
# ==========================================

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: "UserResponse"


# ==========================================
# USERS
# ==========================================

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    avatar: Optional[str] = None
    is_active: bool
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ==========================================
# PRODUCTS
# ==========================================

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: ProductCategory
    prep_time_min: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[ProductCategory] = None
    is_active: Optional[bool] = None
    prep_time_min: Optional[int] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    category: ProductCategory
    is_active: bool
    image: Optional[str] = None
    prep_time_min: Optional[int] = None

    model_config = {"from_attributes": True}


# ==========================================
# ORDERS
# ==========================================

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    extras: list[str] = []
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    table_number: Optional[int] = None
    channel: OrderChannel
    priority: bool = False
    notes: Optional[str] = None
    items: list[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    name: str
    quantity: int
    unit_price: float
    extras: list[str] = []
    notes: Optional[str] = None

    @field_validator("extras", mode="before")
    @classmethod
    def parse_extras(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v or []

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    table_number: Optional[int] = None
    status: OrderStatus
    channel: OrderChannel
    priority: bool
    notes: Optional[str] = None
    subtotal: float
    tax: float
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    model_config = {"from_attributes": True}


# ==========================================
# CLIENT CATEGORIES
# ==========================================

class ClientCategoryCreate(BaseModel):
    key: str
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0


class ClientCategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    logo: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ClientCategoryResponse(BaseModel):
    id: str
    key: str
    name: str
    icon: Optional[str] = None
    logo: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    sort_order: int
    client_count: int = 0

    model_config = {"from_attributes": True}


# ==========================================
# CLIENTS
# ==========================================

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_affiliated: bool = False
    client_category_id: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_affiliated: Optional[bool] = None
    client_category_id: Optional[str] = None


class ClientResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_affiliated: bool
    client_category_id: Optional[str] = None

    model_config = {"from_attributes": True}


# ==========================================
# DASHBOARD
# ==========================================

class CategoryBreakdown(BaseModel):
    name: str
    value: float
    color: str


class PreviousDayMetrics(BaseModel):
    total_sales: float
    total_orders: int
    sales_change: float
    orders_change: float


class DashboardMetrics(BaseModel):
    date: str
    total_sales: float
    total_orders: int
    delivered_orders: int
    takeaway_count: int
    delivery_count: int
    category_breakdown: list[CategoryBreakdown]
    previous_day: Optional[PreviousDayMetrics] = None


# ==========================================
# GENERIC
# ==========================================

class MessageResponse(BaseModel):
    success: bool
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict

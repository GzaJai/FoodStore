import enum
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.config.database import async_session
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    COOK = "COOK"
    CASHIER = "CASHIER"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    READY = "READY"
    SENT = "SENT"
    BILLED = "BILLED"
    CANCELLED = "CANCELLED"


class OrderChannel(str, enum.Enum):
    DELIVERY = "DELIVERY"
    TABLE = "TABLE"
    TAKEAWAY = "TAKEAWAY"


class ProductCategoryDef(Base):
    """Categorías dinámicas de producto con jerarquía padre-hijo"""
    __tablename__ = "product_categories"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False, index=True)
    color = Column(String, nullable=True)
    parent_id = Column(String, ForeignKey("product_categories.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    parent = relationship("ProductCategoryDef", remote_side=[id], back_populates="children", uselist=False)
    children = relationship("ProductCategoryDef", back_populates="parent", uselist=True)
    products = relationship("Product", back_populates="category_ref")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CASHIER, nullable=False)
    avatar = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime, nullable=True)

    orders_created = relationship("Order", back_populates="created_by")
    audit_logs = relationship("AuditLog", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_number = Column(String, unique=True, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    table_number = Column(Integer, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    channel = Column(Enum(OrderChannel), nullable=False, index=True)
    priority = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    subtotal = Column(Numeric(10, 2), default=0)
    tax = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    prepared_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    billed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(String, nullable=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    mp_preference_id = Column(String, nullable=True, index=True)
    mp_payment_status = Column(String, nullable=True)
    mp_payment_id = Column(Integer, nullable=True, index=True)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    created_by = relationship("User", back_populates="orders_created")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    extras = Column(Text, default="[]")  # JSON string para compatibilidad SQLite/PostgreSQL
    notes = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    category_id = Column(String, ForeignKey("product_categories.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    image = Column(String, nullable=True)
    prep_time_min = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category_ref = relationship("ProductCategoryDef", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    ingredients = relationship("Ingredient", secondary="product_ingredients", back_populates="products")

    @property
    def category(self) -> str | None:
        return self.category_ref.key if self.category_ref else None

    @property
    def category_name(self) -> str | None:
        return self.category_ref.name if self.category_ref else None


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False, index=True)
    is_allergen = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    products = relationship("Product", secondary="product_ingredients", back_populates="ingredients")


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(String, ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True)

    @property
    def category(self) -> str | None:
        return self.category_ref.key if self.category_ref else None

    @property
    def category_name(self) -> str | None:
        return self.category_ref.name if self.category_ref else None


class ClientCategory(Base):
    __tablename__ = "client_categories"

    id = Column(String, primary_key=True)
    key = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    clients = relationship("Client", back_populates="category")


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True, index=True)
    address = Column(String, nullable=True)
    is_affiliated = Column(Boolean, default=False)
    client_category_id = Column(String, ForeignKey("client_categories.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category = relationship("ClientCategory", back_populates="clients")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False, index=True)
    entity_id = Column(String, nullable=True)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="audit_logs")

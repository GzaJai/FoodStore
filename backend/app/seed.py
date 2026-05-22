import uuid
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import async_session, engine
from app.models.models import (
    Base, User, UserRole, Product, ProductCategory,
    ClientCategory, Order, OrderItem, OrderStatus, OrderChannel,
)
from sqlalchemy import select
from app.core.security import hash_password


async def seed_database():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Verificar si ya hay datos
        result = await db.execute(select(User))
        if result.scalars().first():
            print("Database already seeded.")
            return

        print("Seeding database...")

        # Users
        users = [
            User(id=str(uuid.uuid4()), name="Admin User", email="admin@foodstore.com", phone="+54 9 11 1234-5678", password_hash=hash_password("admin123"), role=UserRole.ADMIN),
            User(id=str(uuid.uuid4()), name="Carlos Cocina", email="cocina@foodstore.com", phone="+54 9 11 2345-6789", password_hash=hash_password("cocina123"), role=UserRole.COOK),
            User(id=str(uuid.uuid4()), name="Maria Caja", email="caja@foodstore.com", phone="+54 9 11 3456-7890", password_hash=hash_password("caja123"), role=UserRole.CASHIER),
            User(id=str(uuid.uuid4()), name="Juan Gerente", email="gerente@foodstore.com", phone="+54 9 11 4567-8901", password_hash=hash_password("gerente123"), role=UserRole.MANAGER),
        ]
        db.add_all(users)
        await db.flush()

        # Products
        products = [
            Product(id=str(uuid.uuid4()), name="Hamburguesa Clásica", description="Carne 180g, lechuga, tomate, queso", price=5500, category=ProductCategory.ALMUERZOS, prep_time_min=15),
            Product(id=str(uuid.uuid4()), name="Pizza Mozzarella", description="Pizza grande de muzzarella", price=7000, category=ProductCategory.PIZZAS, prep_time_min=20),
            Product(id=str(uuid.uuid4()), name="Faina", description="Faina de garbanzos", price=2500, category=ProductCategory.OTROS, prep_time_min=5),
            Product(id=str(uuid.uuid4()), name="Milanesa Napolitana", description="Milanesa con jamón, queso y salsa", price=8000, category=ProductCategory.ALMUERZOS, prep_time_min=20),
            Product(id=str(uuid.uuid4()), name="Empanadas x6", description="6 empanadas de carne cortadas a cuchillo", price=4500, category=ProductCategory.ENTRADAS, prep_time_min=10),
            Product(id=str(uuid.uuid4()), name="Ensalada César", description="Lechuga, pollo grillado, croutons, parmesano", price=5000, category=ProductCategory.ALMUERZOS, prep_time_min=10),
            Product(id=str(uuid.uuid4()), name="Pasta Bolognesa", description="Tallarines con salsa bolognesa casera", price=6500, category=ProductCategory.ALMUERZOS, prep_time_min=15),
            Product(id=str(uuid.uuid4()), name="Coca Cola", description="Coca Cola 500ml", price=2000, category=ProductCategory.BEBIDAS, prep_time_min=1),
            Product(id=str(uuid.uuid4()), name="Café Latte Grande", description="Café latte en taza grande", price=3000, category=ProductCategory.DESAYUNOS, prep_time_min=5),
            Product(id=str(uuid.uuid4()), name="Tostado Jamón y Queso", description="Tostado de miga con jamón y queso", price=3500, category=ProductCategory.SANDWICHES, prep_time_min=5),
            Product(id=str(uuid.uuid4()), name="Té Verde", description="Té verde en hebras", price=2000, category=ProductCategory.BEBIDAS, prep_time_min=3),
            Product(id=str(uuid.uuid4()), name="Barra de Granola Casera", description="Granola casera con miel y frutos secos", price=2500, category=ProductCategory.DESAYUNOS, prep_time_min=2),
        ]
        db.add_all(products)
        await db.flush()

        # Client Categories
        client_categories = [
            ClientCategory(id=str(uuid.uuid4()), key="all", name="TODOS", icon="Users", color="#6b7280", sort_order=0),
            ClientCategory(id=str(uuid.uuid4()), key="non-affiliated", name="NO AFILIADO", icon="Users", color="#9ca3af", sort_order=1),
            ClientCategory(id=str(uuid.uuid4()), key="delivery", name="DELIVERY", icon="Bike", color="#3b82f6", sort_order=2),
            ClientCategory(id=str(uuid.uuid4()), key="tables", name="MESAS", icon="UtensilsCrossed", color="#10b981", sort_order=3),
            ClientCategory(id=str(uuid.uuid4()), key="dine-in", name="DINE IN", icon="Coffee", color="#f59e0b", sort_order=4),
            ClientCategory(id=str(uuid.uuid4()), key="takeaway", name="TAKE AWAY", icon="ShoppingBag", color="#8b5cf6", sort_order=5),
            ClientCategory(id=str(uuid.uuid4()), key="fixed-address", name="DOMICILIO FIJO", icon="Home", color="#6b7280", sort_order=6),
        ]
        db.add_all(client_categories)
        await db.flush()

        # Sample orders
        now = datetime.now(timezone.utc)
        sample_orders = [
            {
                "customer": "mayra galarza", "channel": OrderChannel.DELIVERY, "status": OrderStatus.PENDING,
                "items": [("Hamburguesa Clásica", 1, [])]
            },
            {
                "customer": "maría lópez", "channel": OrderChannel.TABLE, "status": OrderStatus.PENDING,
                "items": [("Pizza Mozzarella", 1, []), ("Faina", 2, [])]
            },
            {
                "customer": "ezequiel hammel", "channel": OrderChannel.TABLE, "status": OrderStatus.PREPARING,
                "items": [("Milanesa Napolitana", 1, ["Papas fritas"])]
            },
            {
                "customer": "nico usuriaga", "channel": OrderChannel.TAKEAWAY, "status": OrderStatus.READY,
                "items": [("Empanadas x6", 1, [])]
            },
            {
                "customer": "sofia depetris", "channel": OrderChannel.DELIVERY, "status": OrderStatus.SENT,
                "items": [("Ensalada César", 1, [])]
            },
            {
                "customer": "fiorella godoy", "channel": OrderChannel.TABLE, "status": OrderStatus.BILLED,
                "items": [("Pasta Bolognesa", 1, [])]
            },
            {
                "customer": "mauro campos", "channel": OrderChannel.DELIVERY, "status": OrderStatus.CANCELLED,
                "items": [("Coca Cola", 2, [])]
            },
        ]

        product_map = {p.name: p for p in products}
        admin_user = users[0]

        for i, order_data in enumerate(sample_orders):
            order_num = f"FS-{now.strftime('%Y%m%d')}-{90 + i:03d}"
            order_items = []
            subtotal = 0

            for item_name, qty, extras in order_data["items"]:
                product = product_map[item_name]
                line_total = float(product.price) * qty
                subtotal += line_total
                order_items.append(OrderItem(
                    id=str(uuid.uuid4()),
                    product_id=product.id,
                    name=product.name,
                    quantity=qty,
                    unit_price=product.price,
                    extras=json.dumps(extras),
                ))

            tax = subtotal * 0.21
            total = subtotal + tax

            order = Order(
                order_number=order_num,
                customer_name=order_data["customer"],
                channel=order_data["channel"],
                status=order_data["status"],
                subtotal=subtotal,
                tax=tax,
                total=total,
                created_by_id=admin_user.id,
                items=order_items,
            )
            db.add(order)

        await db.commit()
        print("Database seeded successfully!")

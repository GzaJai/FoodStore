import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import async_session, engine
from app.models.models import (
    Base, User, UserRole, Product, ProductCategoryDef,
    ClientCategory,
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

        # Product Categories (dinámicas, reemplazan el enum)
        category_data = [
            ("ALMUERZOS", "Almuerzos", "#f97316"),
            ("SANDWICHES", "Sándwiches", "#3b82f6"),
            ("PIZZAS", "Pizzas", "#8b5cf6"),
            ("DESAYUNOS", "Desayunos", "#10b981"),
            ("BEBIDAS", "Bebidas", "#06b6d4"),
            ("POSTRES", "Postres", "#ec4899"),
            ("ENTRADAS", "Entradas", "#84cc16"),
            ("OTROS", "Otros", "#6b7280"),
        ]
        categories = {}
        for key, name, color in category_data:
            cat = ProductCategoryDef(
                id=str(uuid.uuid4()),
                key=key,
                name=name,
                color=color,
            )
            db.add(cat)
            categories[key] = cat
        await db.flush()

        # Products
        products_data = [
            ("Hamburguesa Clásica", "Carne 180g, lechuga, tomate, queso", 5500, "ALMUERZOS", 15),
            ("Pizza Mozzarella", "Pizza grande de muzzarella", 7000, "PIZZAS", 20),
            ("Faina", "Faina de garbanzos", 2500, "OTROS", 5),
            ("Milanesa Napolitana", "Milanesa con jamón, queso y salsa", 8000, "ALMUERZOS", 20),
            ("Empanadas x6", "6 empanadas de carne cortadas a cuchillo", 4500, "ENTRADAS", 10),
            ("Ensalada César", "Lechuga, pollo grillado, croutons, parmesano", 5000, "ALMUERZOS", 10),
            ("Pasta Bolognesa", "Tallarines con salsa bolognesa casera", 6500, "ALMUERZOS", 15),
            ("Coca Cola", "Coca Cola 500ml", 2000, "BEBIDAS", 1),
            ("Café Latte Grande", "Café latte en taza grande", 3000, "DESAYUNOS", 5),
            ("Tostado Jamón y Queso", "Tostado de miga con jamón y queso", 3500, "SANDWICHES", 5),
            ("Té Verde", "Té verde en hebras", 2000, "BEBIDAS", 3),
            ("Barra de Granola Casera", "Granola casera con miel y frutos secos", 2500, "DESAYUNOS", 2),
        ]
        products = []
        for name, desc, price, cat_key, prep in products_data:
            p = Product(
                id=str(uuid.uuid4()),
                name=name,
                description=desc,
                price=price,
                category_id=categories[cat_key].id,
                prep_time_min=prep,
            )
            db.add(p)
            products.append(p)
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

        await db.commit()
        print("Database seeded successfully!")

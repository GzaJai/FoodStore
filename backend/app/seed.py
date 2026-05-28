import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import async_session, engine
from app.models.models import (
    Base, User, UserRole, Product, ProductCategoryDef,
    ClientCategory, Ingredient,
)
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from app.core.security import hash_password


async def seed_database():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe migration: add Mercado Pago columns if missing
        for col_sql in [
            "ALTER TABLE orders ADD COLUMN mp_preference_id TEXT",
            "ALTER TABLE orders ADD COLUMN mp_payment_status TEXT DEFAULT 'pending'",
            "ALTER TABLE orders ADD COLUMN mp_payment_id INTEGER",
        ]:
            try:
                await conn.execute(text(col_sql))
            except Exception:
                pass  # Column already exists

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

        # ─── Categorías de Productos (jerarquía padre → hijo) ──────────────
        #
        #  Bebidas
        #   ├── Gaseosas      → Coca Cola, Sprite
        #   └── Calientes     → Café, Té Verde
        #  Comidas
        #   ├── Almuerzos     → Hamburguesa Clásica, Milanesa Napolitana, Ensalada César, Pasta Bolognesa
        #   ├── Sándwiches    → Tostado Jamón y Queso
        #   ├── Pizzas        → Pizza Mozzarella
        #   └── Entradas      → Empanadas x6
        #  Desayunos          → Café Latte Grande, Barra de Granola Casera
        #  Postres
        #  Otros              → Faina
        #
        category_defs = [
            # (key, name, color, parent_key or None)
            ("BEBIDAS",   "Bebidas",   "#06b6d4", None),
            ("COMIDAS",   "Comidas",   "#f97316", None),
            ("DESAYUNOS", "Desayunos", "#10b981", None),
            ("POSTRES",   "Postres",   "#ec4899", None),
            ("OTROS",     "Otros",     "#6b7280", None),
            # Hijos de Bebidas
            ("GASEOSAS",  "Gaseosas",  "#06b6d4", "BEBIDAS"),
            ("CALIENTES", "Calientes", "#0891b2", "BEBIDAS"),
            # Hijos de Comidas
            ("ALMUERZOS", "Almuerzos", "#f97316", "COMIDAS"),
            ("SANDWICHES","Sándwiches","#3b82f6", "COMIDAS"),
            ("PIZZAS",    "Pizzas",    "#8b5cf6", "COMIDAS"),
            ("ENTRADAS",  "Entradas",  "#84cc16", "COMIDAS"),
        ]

        categories = {}
        for key, name, color, _parent_key in category_defs:
            cat = ProductCategoryDef(id=str(uuid.uuid4()), key=key, name=name, color=color)
            db.add(cat)
            categories[key] = cat
        await db.flush()

        # Asignar parent_id ahora que tenemos todos los IDs
        for key, _name, _color, parent_key in category_defs:
            if parent_key:
                categories[key].parent_id = categories[parent_key].id
        await db.flush()

        # ─── Productos ──────────────────────────────────────────────────
        products_data = [
            # name, desc, price, category_key, prep_time
            ("Hamburguesa Clásica",  "Carne 180g, lechuga, tomate, queso",         5500, "ALMUERZOS", 15),
            ("Milanesa Napolitana",  "Milanesa con jamón, queso y salsa",           8000, "ALMUERZOS", 20),
            ("Ensalada César",       "Lechuga, pollo grillado, croutons, parmesano",5000, "ALMUERZOS", 10),
            ("Pasta Bolognesa",      "Tallarines con salsa bolognesa casera",       6500, "ALMUERZOS", 15),
            ("Pizza Mozzarella",     "Pizza grande de muzzarella",                  7000, "PIZZAS",    20),
            ("Tostado Jamón y Queso","Tostado de miga con jamón y queso",           3500, "SANDWICHES", 5),
            ("Empanadas x6",         "6 empanadas de carne cortadas a cuchillo",    4500, "ENTRADAS",  10),
            ("Coca Cola",            "Coca Cola 500ml",                             2000, "GASEOSAS",   1),
            ("Sprite",               "Sprite 500ml",                                2000, "GASEOSAS",   1),
            ("Café",                 "Café expreso",                                2500, "CALIENTES",  5),
            ("Té Verde",             "Té verde en hebras",                          2000, "CALIENTES",  3),
            ("Café Latte Grande",    "Café latte en taza grande",                   3000, "DESAYUNOS",  5),
            ("Barra de Granola Casera","Granola casera con miel y frutos secos",    2500, "DESAYUNOS",  2),
            ("Faina",                "Faina de garbanzos",                          2500, "OTROS",      5),
        ]
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
        await db.flush()

        # ─── Ingredientes con alérgenos ──────────────────────────────
        ingredients_data = [
            # (name, is_allergen)
            ("Gluten",       True),
            ("Lácteos",      True),
            ("Huevos",       True),
            ("Maní",         True),
            ("Mostaza",      True),
            ("Apio",         True),
            ("Frutos Secos", True),
            ("Carne vacuna",  False),
            ("Pollo",        False),
            ("Jamón",        False),
            ("Queso",        False),
            ("Lechuga",      False),
            ("Tomate",       False),
            ("Pan",          False),
            ("Pasta",        False),
            ("Salsa de Tomate", False),
            ("Avena",        False),
            ("Miel",         False),
            ("Harina de Garbanzos", False),
            ("Leche",        False),
            ("Café",         False),
            ("Té Verde",     False),
        ]
        ingredients = {}
        for name, is_allergen in ingredients_data:
            ing = Ingredient(id=str(uuid.uuid4()), name=name, is_allergen=is_allergen)
            db.add(ing)
            ingredients[name] = ing
        await db.flush()

        # ─── Asociar ingredientes a productos ────────────────────────
        # Buscar productos por nombre con la relación ingredients precargada
        prod_result = await db.execute(
            select(Product).options(selectinload(Product.ingredients))
        )
        all_products = {p.name: p for p in prod_result.scalars().all()}

        # Incluimos tanto ingredientes reales como marcadores de alérgenos
        # para que el frontend pueda mostrar advertencias basadas en is_allergen=True
        product_ingredient_map = {
            "Hamburguesa Clásica":   ["Pan", "Carne vacuna", "Lechuga", "Tomate", "Queso", "Gluten", "Lácteos"],
            "Milanesa Napolitana":   ["Carne vacuna", "Pan", "Huevos", "Jamón", "Queso", "Gluten", "Lácteos"],
            "Ensalada César":        ["Lechuga", "Pollo", "Queso", "Gluten", "Lácteos"],
            "Pasta Bolognesa":       ["Pasta", "Carne vacuna", "Salsa de Tomate", "Gluten", "Huevos"],
            "Pizza Mozzarella":      ["Queso", "Salsa de Tomate", "Gluten", "Lácteos"],
            "Tostado Jamón y Queso": ["Pan", "Jamón", "Queso", "Gluten", "Lácteos"],
            "Empanadas x6":          ["Carne vacuna", "Gluten", "Huevos"],
            "Café Latte Grande":     ["Café", "Leche", "Lácteos"],
            "Barra de Granola Casera": ["Avena", "Miel", "Frutos Secos"],
            "Faina":                 ["Harina de Garbanzos"],
        }

        for prod_name, ing_names in product_ingredient_map.items():
            product = all_products.get(prod_name)
            if product:
                product.ingredients = [ingredients[name] for name in ing_names if name in ingredients]
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

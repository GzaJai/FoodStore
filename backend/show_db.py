"""Script para ver el contenido de la base de datos."""
import asyncio
from app.config.database import async_session
from app.models.models import User, Product, Order, ClientCategory, OrderItem
from sqlalchemy import select


async def main():
    async with async_session() as db:
        # Users
        users = (await db.execute(select(User))).scalars().all()
        print("\n" + "=" * 60)
        print("  USERS")
        print("=" * 60)
        for u in users:
            print(f"  {u.email:<30} {u.role.value:<10} {u.name}")

        # Products
        products = (await db.execute(select(Product))).scalars().all()
        print(f"\n  PRODUCTS ({len(products)})")
        print("-" * 60)
        for p in products:
            print(f"  {p.name:<30} ${float(p.price):>8.2f}  {p.category.value}")

        # Client Categories
        cats = (await db.execute(select(ClientCategory))).scalars().all()
        print(f"\n  CLIENT CATEGORIES ({len(cats)})")
        print("-" * 60)
        for c in cats:
            print(f"  {c.key:<20} {c.name:<20} {c.icon or '-'}")

        # Orders
        orders = (await db.execute(select(Order))).scalars().all()
        print(f"\n  ORDERS ({len(orders)})")
        print("-" * 60)
        for o in orders:
            items = (await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))).scalars().all()
            item_names = ", ".join(f"{i.quantity}x {i.name}" for i in items)
            print(f"  #{o.id:<3} {o.order_number} | {o.customer_name:<20} | {o.status.value:<12} | {o.channel.value:<10}")
            print(f"        Items: {item_names}")

        print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

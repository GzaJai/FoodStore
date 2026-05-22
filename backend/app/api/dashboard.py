from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from app.config.database import get_db
from app.models.models import Order, OrderItem, OrderStatus, OrderChannel, Product, ProductCategory
from app.schemas.schemas import DashboardMetrics, CategoryBreakdown, PreviousDayMetrics, OrderResponse
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["7. Dashboard"])


@router.get(
    "/metrics",
    response_model=DashboardMetrics,
    summary="Obtener métricas del dashboard",
    description="""Obtiene las métricas del dashboard para una fecha específica:

- Ventas totales del día
- Cantidad de pedidos
- Pedidos entregados (acumulado)
- Distribución por canal (takeaway/delivery)
- Breakdown por categoría de producto
- Comparación con el día anterior (cambio porcentual)
""",
)
async def get_metrics(
    date: str | None = Query(None, description="Fecha en formato YYYY-MM-DD (default: hoy)"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now(timezone.utc).date()
    prev_date = target_date - timedelta(days=1)

    total_orders_result = await db.execute(
        select(func.count(Order.id)).where(cast(Order.created_at, Date) == target_date)
    )
    total_orders = total_orders_result.scalar() or 0

    total_sales_result = await db.execute(
        select(func.sum(Order.total)).where(
            (Order.status == OrderStatus.BILLED) & (cast(Order.created_at, Date) == target_date)
        )
    )
    total_sales = float(total_sales_result.scalar() or 0)

    delivered_result = await db.execute(
        select(func.count(Order.id)).where(
            (Order.status == OrderStatus.BILLED) & (cast(Order.created_at, Date) <= target_date)
        )
    )
    delivered_orders = delivered_result.scalar() or 0

    takeaway_result = await db.execute(
        select(func.count(Order.id)).where(
            (Order.channel == OrderChannel.TAKEAWAY) & (cast(Order.created_at, Date) == target_date)
        )
    )
    takeaway_count = takeaway_result.scalar() or 0

    delivery_result = await db.execute(
        select(func.count(Order.id)).where(
            (Order.channel == OrderChannel.DELIVERY) & (cast(Order.created_at, Date) == target_date)
        )
    )
    delivery_count = delivery_result.scalar() or 0

    items_result = await db.execute(
        select(Product.category, func.count(OrderItem.id))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(cast(Order.created_at, Date) == target_date)
        .group_by(Product.category)
    )
    category_counts = items_result.all()

    total_items = sum(count for _, count in category_counts) or 1
    category_colors = {
        ProductCategory.ALMUERZOS: "#f97316",
        ProductCategory.SANDWICHES: "#3b82f6",
        ProductCategory.PIZZAS: "#8b5cf6",
        ProductCategory.DESAYUNOS: "#10b981",
        ProductCategory.BEBIDAS: "#06b6d4",
        ProductCategory.POSTRES: "#ec4899",
        ProductCategory.ENTRADAS: "#84cc16",
        ProductCategory.OTROS: "#6b7280",
    }

    category_breakdown = [
        CategoryBreakdown(
            name=cat.value,
            value=round((count / total_items) * 100, 1),
            color=category_colors.get(cat, "#6b7280"),
        )
        for cat, count in category_counts
    ]

    prev_sales_result = await db.execute(
        select(func.sum(Order.total)).where(
            (Order.status == OrderStatus.BILLED) & (cast(Order.created_at, Date) == prev_date)
        )
    )
    prev_sales = float(prev_sales_result.scalar() or 0)

    prev_orders_result = await db.execute(
        select(func.count(Order.id)).where(cast(Order.created_at, Date) == prev_date)
    )
    prev_orders = prev_orders_result.scalar() or 0

    previous_day = None
    if prev_orders > 0 or prev_sales > 0:
        sales_change = round(((total_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0, 1)
        orders_change = round(((total_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0, 1)
        previous_day = PreviousDayMetrics(
            total_sales=prev_sales,
            total_orders=prev_orders,
            sales_change=sales_change,
            orders_change=orders_change,
        )

    return DashboardMetrics(
        date=target_date.isoformat(),
        total_sales=total_sales,
        total_orders=total_orders,
        delivered_orders=delivered_orders,
        takeaway_count=takeaway_count,
        delivery_count=delivery_count,
        category_breakdown=category_breakdown,
        previous_day=previous_day,
    )


@router.get(
    "/open-orders",
    response_model=list[OrderResponse],
    summary="Pedidos abiertos",
    description="Lista los pedidos que están en estado PENDING, PREPARING o READY, ordenados por prioridad y antigüedad.",
)
async def get_open_orders(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.status.in_([OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY]))
        .order_by(Order.priority.desc(), Order.created_at.asc())
    )
    orders = result.scalars().all()

    responses = []
    for order in orders:
        items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        order.items = items_result.scalars().all()
        responses.append(OrderResponse.model_validate(order))

    return responses

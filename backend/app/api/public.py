import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.database import get_db
from app.models.models import Product, ProductCategoryDef, Order, OrderItem, OrderStatus, OrderChannel
from app.schemas.schemas import ProductResponse, ProductPage, PaginationMeta
from app.ws.manager import manager

logger = logging.getLogger("foodstore.api.public")

router = APIRouter(prefix="/api/public", tags=["0. Público"])


def _generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    return f"FS-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# ─── Products ─────────────────────────────────────────


@router.get(
    "/products",
    response_model=ProductPage,
    summary="Listar productos activos (público)",
    description="Lista paginada de productos activos, sin necesidad de autenticación.",
)
async def list_public_products(
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Productos por página"),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import joinedload

    # Count
    count_result = await db.execute(
        select(func.count(Product.id)).where(Product.is_active == True)
    )
    total = count_result.scalar() or 0

    # Fetch page
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Product)
        .options(joinedload(Product.category_ref), joinedload(Product.ingredients))
        .where(Product.is_active == True)
        .order_by(ProductCategoryDef.name, Product.name)
        .join(ProductCategoryDef, Product.category_id == ProductCategoryDef.id, isouter=True)
        .offset(offset)
        .limit(per_page)
    )
    items = [ProductResponse.model_validate(p) for p in result.unique().scalars().all()]

    return ProductPage(
        items=items,
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=max(1, (total + per_page - 1) // per_page),
        ),
    )


# ─── Orders ───────────────────────────────────────────


@router.post(
    "/orders",
    status_code=201,
    summary="Crear pedido (público)",
    description="""
    Crea un nuevo pedido desde la página pública.
    No requiere autenticación. Los items deben incluir product_id y cantidad.
    El pedido se crea en estado PENDING y aparece automáticamente en el sistema.
    """,
)
async def create_public_order(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Body esperado:
    {
        "customer_name": str,
        "customer_phone": str | null,
        "customer_email": str | null,
        "channel": "DELIVERY" | "TABLE" | "TAKEAWAY",
        "address": str | null,
        "notes": str | null,
        "items": [
            { "product_id": str, "quantity": int, "extras": [str] }
        ]
    }
    """
    # Validar campos requeridos
    customer_name = body.get("customer_name")
    if not customer_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_name es requerido")

    channel_raw = body.get("channel", "TAKEAWAY")
    try:
        channel = OrderChannel(channel_raw)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Canal inválido: {channel_raw}")

    items_data = body.get("items", [])
    if not items_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe incluir al menos un item")

    # Procesar items
    subtotal = 0
    items_to_create = []

    for item_body in items_data:
        product_id = item_body.get("product_id")
        quantity = item_body.get("quantity", 1)

        if not product_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="product_id es requerido en cada item")

        product_result = await db.execute(select(Product).where(Product.id == product_id))
        product = product_result.scalar_one_or_none()

        if not product or not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Producto {product_id} no encontrado o inactivo")

        line_total = float(product.price) * quantity
        subtotal += line_total

        items_to_create.append(OrderItem(
            id=str(uuid.uuid4()),
            product_id=product.id,
            name=product.name,
            quantity=quantity,
            unit_price=product.price,
            extras=json.dumps(item_body.get("extras", [])),
            notes=item_body.get("notes"),
        ))

    tax = subtotal * 0.21
    total = subtotal + tax

    # Crear orden
    order = Order(
        order_number=_generate_order_number(),
        customer_name=customer_name,
        customer_phone=body.get("customer_phone"),
        customer_email=body.get("customer_email"),
        channel=channel,
        notes=body.get("notes"),
        subtotal=subtotal,
        tax=tax,
        total=total,
        items=items_to_create,
    )

    db.add(order)
    await db.commit()

    # Cargar items con refresh para evitar lazy-load en async
    await db.refresh(order, ["items"])

    # Broadcast a todos los paneles conectados
    await manager.broadcast({
        "type": "order_created",
        "payload": {
            "order_id": order.id,
            "order_number": order.order_number,
        },
    })
    logger.info("Orden #%s creada desde web pública — broadcast enviado", order.order_number)

    from app.schemas.schemas import OrderResponse
    return OrderResponse.model_validate(order)

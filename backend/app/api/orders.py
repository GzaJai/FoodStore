import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.database import get_db
from app.models.models import Order, OrderItem, OrderStatus, OrderChannel, Product, User, UserRole
from app.schemas.schemas import OrderCreate, OrderStatusUpdate, OrderResponse
from app.core.auth import get_current_user
from app.ws.manager import manager

logger = logging.getLogger("foodstore.api.orders")

router = APIRouter(prefix="/api/orders", tags=["4. Pedidos"])

VALID_TRANSITIONS: dict[OrderStatus, list[OrderStatus]] = {
    OrderStatus.PENDING: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.SENT, OrderStatus.BILLED, OrderStatus.CANCELLED],
    OrderStatus.SENT: [OrderStatus.BILLED],
    OrderStatus.BILLED: [],
    OrderStatus.CANCELLED: [],
}


def _generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    return f"FS-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


@router.get(
    "",
    response_model=list[OrderResponse],
    summary="Listar pedidos",
    description="Lista pedidos con filtros por estado, canal, búsqueda y fecha. Soporta paginación.",
)
async def list_orders(
    status_filter: OrderStatus | None = Query(None, alias="status", description="Filtrar por estado"),
    channel: OrderChannel | None = Query(None, description="Filtrar por canal"),
    search: str | None = Query(None, description="Buscar por cliente o número"),
    date: str | None = Query(None, description="Filtrar por fecha (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    query = select(Order)
    if status_filter:
        query = query.where(Order.status == status_filter)
    if channel:
        query = query.where(Order.channel == channel)
    if search:
        query = query.where(
            (Order.customer_name.ilike(f"%{search}%")) |
            (Order.order_number.ilike(f"%{search}%"))
        )
    if date:
        query = query.where(func.date(Order.created_at) == date)

    query = query.order_by(Order.created_at.desc())
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    orders = result.scalars().all()

    responses = []
    for order in orders:
        await db.refresh(order, ["items"])
        responses.append(OrderResponse.model_validate(order))

    return responses


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Obtener pedido",
    description="Obtiene el detalle completo de un pedido por su ID.",
)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    return OrderResponse.model_validate(order)


@router.post(
    "",
    response_model=OrderResponse,
    status_code=201,
    summary="Crear pedido",
    description="Crea un nuevo pedido con items. Calcula subtotal, IVA (21%) y total automáticamente.",
)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    subtotal = 0
    items_to_create = []

    for item_body in body.items:
        product_result = await db.execute(select(Product).where(Product.id == item_body.product_id))
        product = product_result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Producto {item_body.product_id} no encontrado",
            )

        line_total = float(product.price) * item_body.quantity
        subtotal += line_total

        items_to_create.append(OrderItem(
            id=str(uuid.uuid4()),
            product_id=product.id,
            name=product.name,
            quantity=item_body.quantity,
            unit_price=product.price,
            extras=json.dumps(item_body.extras),
            notes=item_body.notes,
        ))

    tax = subtotal * 0.21
    total = subtotal + tax

    order = Order(
        order_number=_generate_order_number(),
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        customer_email=body.customer_email,
        table_number=body.table_number,
        channel=body.channel,
        priority=body.priority,
        notes=body.notes,
        subtotal=subtotal,
        tax=tax,
        total=total,
        created_by_id=user.id,
        items=items_to_create,
    )

    db.add(order)
    await db.commit()

    await db.refresh(order, ["items"])

    # Broadcast a paneles conectados
    await manager.broadcast({
        "type": "order_created",
        "payload": {
            "order_id": order.id,
            "order_number": order.order_number,
        },
    })
    logger.info("Orden #%s creada por %s — broadcast enviado", order.order_number, user.name)

    return OrderResponse.model_validate(order)


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Cambiar estado del pedido",
    description="""Cambia el estado de un pedido siguiendo la máquina de estados:

- **PENDING** → PREPARING, CANCELLED
- **PREPARING** → READY, CANCELLED
- **READY** → SENT, CANCELLED
- **SENT** → BILLED
- **BILLED** → (terminal)
- **CANCELLED** → (terminal)
""",
    responses={
        200: {"description": "Estado actualizado"},
        400: {"description": "Transición no válida"},
        404: {"description": "Pedido no encontrado"},
    },
)
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    old_status = order.status

    # Admin puede ir a CUALQUIER estado (por si hubo un error en el proceso)
    # El resto de roles debe seguir la máquina de estados estricta
    if user.role != UserRole.ADMIN:
        allowed = VALID_TRANSITIONS.get(old_status, [])
        if body.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transición no válida: {old_status.value} → {body.status.value}",
            )

    now = datetime.now(timezone.utc)
    order.status = body.status

    if body.status == OrderStatus.PREPARING:
        order.prepared_at = now
    elif body.status == OrderStatus.SENT:
        order.sent_at = now
    elif body.status == OrderStatus.BILLED:
        order.billed_at = now
    elif body.status == OrderStatus.CANCELLED:
        order.cancelled_at = now

    await db.commit()
    await db.refresh(order, ["items"])

    # Broadcast actualización de estado
    await manager.broadcast({
        "type": "order_updated",
        "payload": {
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.status.value,
        },
    })
    logger.info(
        "Orden #%s (%s): %s → %s — broadcast enviado",
        order.order_number, user.name,
        old_status.value, body.status.value,
    )

    return OrderResponse.model_validate(order)


@router.delete(
    "/{order_id}",
    summary="Cancelar pedido",
    description="Cancela un pedido (cambia estado a CANCELLED). No se puede cancelar si ya está BILLED o CANCELLED.",
)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    if order.status in (OrderStatus.BILLED, OrderStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar un pedido ya facturado o cancelado",
        )

    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.now(timezone.utc)
    await db.commit()
    return {"success": True, "message": "Pedido cancelado"}

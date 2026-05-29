import uuid
import json
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
import mercadopago
from app.config.database import get_db
from app.config.settings import settings
from app.models.models import Product, ProductCategoryDef, Order, OrderItem, OrderStatus, OrderChannel, User, UserRole
from app.schemas.schemas import ProductResponse, ProductPage, PaginationMeta, PreferenceResponse, PaymentResponse, LoginResponse, OrderResponse, OrderPage
from app.ws.manager import manager
from app.core.security import hash_password, create_access_token
from app.core.auth import get_optional_user, get_current_user

logger = logging.getLogger("foodstore.api.public")

router = APIRouter(prefix="/api/public", tags=["0. Público"])


def _generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    return f"FS-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# ─── Auth (Clientes) ──────────────────────────────────


@router.post(
    "/register",
    response_model=LoginResponse,
    status_code=201,
    summary="Registrar nuevo cliente",
    description="Registra un cliente nuevo, lo autentica automáticamente y devuelve los datos del usuario.",
)
async def register_customer(
    body: dict,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Body esperado:
    {
        "name": str,
        "email": str,
        "password": str,
        "phone": str | null
    }
    """
    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    phone = body.get("phone")

    # ── Validaciones ──
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="El nombre es requerido")
    if not email or not email.strip():
        raise HTTPException(status_code=400, detail="El email es requerido")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    # Normalizar email
    email = email.strip().lower()

    # Verificar email no duplicado
    existing = await db.execute(
        select(User).where(or_(User.email == email, User.name == name.strip()))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="El email o nombre de usuario ya está registrado")

    # ── Crear usuario ──
    user = User(
        id=str(uuid.uuid4()),
        name=name.strip(),
        email=email,
        phone=phone.strip() if phone else None,
        password_hash=hash_password(password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # ── Generar token y setear cookie ──
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role.value,
    })
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        max_age=settings.JWT_EXPIRES_IN,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )

    from app.schemas.schemas import UserResponse
    return LoginResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


# ─── Products ─────────────────────────────────────────


@router.get(
    "/products",
    response_model=ProductPage,
    summary="Listar productos activos (público)",
    description="Lista paginada de productos activos, sin necesidad de autenticación. Soporta filtros por búsqueda textual y categoría.",
)
async def list_public_products(
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Productos por página"),
    search: str | None = Query(None, description="Buscar por nombre del producto"),
    category_id: str | None = Query(None, description="Filtrar por ID de categoría"),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import joinedload

    # Base query
    query = (
        select(Product)
        .options(joinedload(Product.category_ref), joinedload(Product.ingredients))
        .where(Product.is_active == True)
    )
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.where(Product.category_id == category_id)

    # Count
    count_query = select(func.count(Product.id)).where(Product.is_active == True)
    if search:
        count_query = count_query.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        count_query = count_query.where(Product.category_id == category_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Fetch page
    offset = (page - 1) * per_page
    result = await db.execute(
        query
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
    current_user: User | None = Depends(get_optional_user),
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
        address=body.get("address"),
        subtotal=subtotal,
        tax=tax,
        total=total,
        created_by_id=current_user.id if current_user else None,
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

    return OrderResponse.model_validate(order)


# ─── Mercado Pago ─────────────────────────────────


@router.post(
    "/create-preference",
    response_model=PreferenceResponse,
    status_code=201,
    summary="Crear preferencia de pago (Mercado Pago)",
    description="""
    Crea la orden y una preferencia de pago en Mercado Pago.
    Devuelve la URL de Checkout Pro para redirigir al usuario.
    """,
)
async def create_mp_preference(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Body esperado: mismo formato que create_public_order
    """
    if not settings.MERCADO_PAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Mercado Pago no está configurado")

    # ── Validar campos requeridos ──
    customer_name = body.get("customer_name")
    if not customer_name:
        raise HTTPException(status_code=400, detail="customer_name es requerido")

    channel_raw = body.get("channel", "TAKEAWAY")
    try:
        channel = OrderChannel(channel_raw)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Canal inválido: {channel_raw}")

    items_data = body.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un item")

    # ── Procesar items y calcular total ──
    subtotal = 0.0
    items_to_create = []
    mp_items = []

    for item_body in items_data:
        product_id = item_body.get("product_id")
        quantity = item_body.get("quantity", 1)
        if not product_id:
            raise HTTPException(status_code=400, detail="product_id es requerido en cada item")

        product_result = await db.execute(select(Product).where(Product.id == product_id))
        product = product_result.scalar_one_or_none()
        if not product or not product.is_active:
            raise HTTPException(status_code=400, detail=f"Producto {product_id} no encontrado o inactivo")

        unit_price = float(product.price)
        line_total = unit_price * quantity
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

        mp_items.append({
            "id": product.id,
            "title": product.name,
            "quantity": quantity,
            "unit_price": unit_price,
            "currency_id": "ARS",
        })

    tax = subtotal * 0.21
    total = round(subtotal + tax, 2)

    # ── Crear la orden en la DB ──
    order = Order(
        order_number=_generate_order_number(),
        customer_name=customer_name,
        customer_phone=body.get("customer_phone"),
        customer_email=body.get("customer_email"),
        channel=channel,
        notes=body.get("notes"),
        address=body.get("address"),
        subtotal=subtotal,
        tax=tax,
        total=total,
        mp_payment_status="pending",
        created_by_id=current_user.id if current_user else None,
        items=items_to_create,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order, ["items"])

    # ── Crear preferencia en Mercado Pago ──
    preference_data: dict = {
        "items": mp_items,
        "payer": {"name": customer_name},
        "external_reference": str(order.id),
        "statement_descriptor": "FOODSTORE",
    }

    # MP en producción exige HTTPS para back_urls y notification_url.
    # En sandbox (TEST-) o si explícitamente se configura MP_IS_SANDBOX=true,
    # enviamos las URLs aunque sean HTTP.
    # En producción solo las enviamos si FRONTEND_URL es HTTPS.
    # Si nada aplica, el usuario debe configurarlas desde el Dashboard de MP.
    mp_is_sandbox = (
        settings.MP_IS_SANDBOX
        if settings.MP_IS_SANDBOX is not None
        else settings.MERCADO_PAGO_ACCESS_TOKEN.startswith("TEST-")
    )
    can_send_urls = mp_is_sandbox or settings.FRONTEND_URL.startswith("https://")

    if can_send_urls:
        # MP NO acepta localhost en back_urls con auto_return (documentado).
        # Si la URL es localhost, mandamos back_urls sin auto_return para
        # que el usuario vuelva manualmente clickeando "Volver al sitio".
        is_local_url = "localhost" in settings.FRONTEND_URL or "127.0.0.1" in settings.FRONTEND_URL

        preference_data["back_urls"] = {
            "success": f"{settings.FRONTEND_URL}/?payment=success&order={order.order_number}",
            "failure": f"{settings.FRONTEND_URL}/?payment=failure&order={order.order_number}",
            "pending": f"{settings.FRONTEND_URL}/?payment=pending&order={order.order_number}",
        }
        if not is_local_url:
            preference_data["auto_return"] = "approved"
        preference_data["notification_url"] = f"{settings.BACKEND_URL}/api/webhooks/mercadopago"
    else:
        logger.warning(
            "Token de producción con FRONTEND_URL HTTP (%s). "
            "No se enviaron back_urls ni notification_url. "
            "Configuralos en el Dashboard de MP para que el flujo completo funcione.",
            settings.FRONTEND_URL,
        )

    try:
        sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
        preference_response = await asyncio.to_thread(sdk.preference().create, preference_data)
        preference = preference_response["response"]
    except Exception as e:
        logger.error("Error al crear preferencia en Mercado Pago: %s", e)
        raise HTTPException(status_code=502, detail="No se pudo crear la preferencia de pago con Mercado Pago")

    preference_id = preference["id"]
    init_point = preference["init_point"]

    # Guardar preference_id en la orden
    order.mp_preference_id = preference_id
    await db.commit()

    # Broadcast del nuevo pedido
    await manager.broadcast({
        "type": "order_created",
        "payload": {
            "order_id": order.id,
            "order_number": order.order_number,
        },
    })
    logger.info("Orden #%s creada con MP preference %s", order.order_number, preference_id)

    return PreferenceResponse(
        init_point=init_point,
        preference_id=preference_id,
        order_id=order.id,
        order_number=order.order_number,
    )


@router.post(
    "/create-payment",
    response_model=PaymentResponse,
    status_code=201,
    summary="Procesar pago con tarjeta (Mercado Pago CardPayment)",
    description="""
    Procesa un pago usando el token de tarjeta generado por el CardPayment Brick.
    El token se obtiene del onSubmit del brick y se envía junto con el ID de la orden.
    """,
)
async def create_mp_payment(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Crea la orden Y procesa el pago de forma atómica.

    Body esperado:
    {
        "card_token": str,
        "customer_name": str,
        "customer_phone": str | null,
        "customer_email": str | null,
        "channel": "DELIVERY" | "TABLE" | "TAKEAWAY",
        "address": str | null,
        "notes": str | null,
        "items": [
            { "product_id": str, "quantity": int, "extras": [str], "notes": str | null }
        ]
    }

    La orden solo se persiste en la DB si Mercado Pago aprueba el pago (status=approved).
    Si el pago es rechazado o queda en otro estado, la orden NO se crea.
    Si el usuario está autenticado (cookie JWT), la orden se vincula a su cuenta.
    """
    card_token = body.get("card_token")
    if not card_token:
        raise HTTPException(status_code=400, detail="card_token es requerido")

    if not settings.MERCADO_PAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Mercado Pago no está configurado")

    # ── Validar datos de la orden ──────────────────────────────────
    customer_name = body.get("customer_name")
    if not customer_name:
        raise HTTPException(status_code=400, detail="customer_name es requerido")

    channel_raw = body.get("channel", "TAKEAWAY")
    try:
        channel = OrderChannel(channel_raw)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Canal inválido: {channel_raw}")

    items_data = body.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un item")

    # ── Procesar items y calcular total ────────────────────────────
    subtotal = 0.0
    items_to_create = []

    for item_body in items_data:
        product_id = item_body.get("product_id")
        quantity = item_body.get("quantity", 1)
        if not product_id:
            raise HTTPException(status_code=400, detail="product_id es requerido en cada item")

        product_result = await db.execute(select(Product).where(Product.id == product_id))
        product = product_result.scalar_one_or_none()
        if not product or not product.is_active:
            raise HTTPException(
                status_code=400, detail=f"Producto {product_id} no encontrado o inactivo"
            )

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

    tax = round(subtotal * 0.21, 2)
    total = round(subtotal + tax, 2)

    # ── Procesar pago en Mercado Pago ──────────────────────────────
    description = f"Pedido FoodStore — {customer_name}"
    payment_data = {
        "transaction_amount": total,
        "token": card_token,
        "description": description,
        "installments": 1,
        "payer": {"email": body.get("customer_email") or "cliente@foodstore.com"},
        "external_reference": customer_name,
    }

    try:
        sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
        payment_response = await asyncio.to_thread(sdk.payment().create, payment_data)
    except Exception as e:
        logger.error("Error al comunicarse con Mercado Pago: %s", e)
        raise HTTPException(status_code=502, detail="Error al procesar el pago con Mercado Pago")

    if payment_response.get("status") not in (200, 201):
        logger.error("Mercado Pago rechazó el pago: %s", payment_response.get("response", {}))
        raise HTTPException(
            status_code=502,
            detail=f"Error de Mercado Pago: {payment_response.get('response', {})}",
        )

    mp_data = payment_response.get("response", {})
    mp_payment_id = mp_data.get("id")
    mp_status = mp_data.get("status")
    status_detail = mp_data.get("status_detail")

    # ── Si el pago fue aprobado → crear la orden y committear ──────
    if mp_status == "approved":
        order = Order(
            order_number=_generate_order_number(),
            customer_name=customer_name,
            customer_phone=body.get("customer_phone"),
            customer_email=body.get("customer_email"),
            channel=channel,
            notes=body.get("notes"),
            address=body.get("address"),
            subtotal=subtotal,
            tax=tax,
            total=total,
            mp_payment_id=mp_payment_id,
            mp_payment_status=mp_status,
            created_by_id=current_user.id if current_user else None,
            items=items_to_create,
        )

        db.add(order)
        await db.commit()
        await db.refresh(order, ["items"])

        # Broadcast a los paneles de cocina
        await manager.broadcast({
            "type": "order_created",
            "payload": {
                "order_id": order.id,
                "order_number": order.order_number,
            },
        })
        logger.info(
            "Orden #%s creada (pago aprobado, MP id=%s)",
            order.order_number, mp_payment_id,
        )

        return PaymentResponse(
            status=mp_status,
            status_detail=status_detail,
            mp_payment_id=mp_payment_id,
            order_id=order.id,
            order_number=order.order_number,
        )

    # ── Pago no aprobado → NO se crea la orden ─────────────────────
    logger.info(
        "Pago no aprobado (status=%s, detail=%s) — orden NO creada",
        mp_status, status_detail,
    )
    return PaymentResponse(
        status=mp_status,
        status_detail=status_detail,
        mp_payment_id=mp_payment_id,
        order_id=None,
        order_number=None,
    )


# ─── Customer Order History ────────────────────────────


@router.get(
    "/orders",
    response_model=OrderPage,
    summary="Historial de pedidos del usuario autenticado",
    description="Devuelve los pedidos del usuario autenticado, tanto los hechos estando logueado como los hechos como invitado con el mismo email.",
)
async def list_customer_orders(
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(10, ge=1, le=50, description="Pedidos por página"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Requiere autenticación. Devuelve las órdenes vinculadas al usuario,
    tanto por created_by_id (logueado al pedir) como por customer_email (invitado con mismo email)."""
    from sqlalchemy.orm import selectinload
    from sqlalchemy import and_

    # Matcheamos por created_by_id (logueado) + customer_email (invitado con mismo email)
    user_filter = or_(
        Order.created_by_id == current_user.id,
        and_(
            Order.created_by_id.is_(None),
            Order.customer_email == current_user.email,
        ),
    )

    # Base query
    base_query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(user_filter)
    )

    # Count
    count_query = select(func.count(Order.id)).where(user_filter)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Fetch page
    offset = (page - 1) * per_page
    result = await db.execute(
        base_query
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    items = [OrderResponse.model_validate(o) for o in result.unique().scalars().all()]

    return OrderPage(
        items=items,
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=max(1, (total + per_page - 1) // per_page),
        ),
    )

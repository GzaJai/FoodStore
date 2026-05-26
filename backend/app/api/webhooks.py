import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.config.database import get_db
from app.config.settings import settings
from app.models.models import Order

logger = logging.getLogger("foodstore.api.webhooks")

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


@router.post("/mercadopago", status_code=200)
async def mercadopago_ipn(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook IPN (Instant Payment Notification) de Mercado Pago.

    Mercado Pago envía notificaciones cuando cambia el estado de un pago.
    El body puede venir como form-data o JSON, con los campos:
    - type / topic: "payment"
    - id / data.id: el ID del pago en MP

    Endpoint público ya que MP no puede autenticarse fácilmente.
    En producción, validar `x-signature` o usar un token de query param.
    """
    try:
        raw = await request.json()
    except Exception:
        raw = dict(await request.form())

    logger.info("Mercado Pago IPN raw: %s", raw)

    # MP puede enviar el payload de distintas formas
    topic = raw.get("type") or raw.get("topic")
    resource_id = raw.get("id") or (raw.get("data") or {}).get("id")

    if topic != "payment" or not resource_id:
        # No es una notificación de pago — igual respondemos 200 para que MP no reintente
        return {"received": True}

    if not settings.MERCADO_PAGO_ACCESS_TOKEN:
        logger.warning("Mercado Pago no está configurado — ignorando IPN")
        return {"received": True}

    # Consultar el pago para obtener el preference_id
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"https://api.mercadopago.com/v1/payments/{resource_id}",
                headers={"Authorization": f"Bearer {settings.MERCADO_PAGO_ACCESS_TOKEN}"},
                timeout=15,
            )
        if res.status_code != 200:
            logger.error("Error al consultar pago %s: %s", resource_id, res.status_code)
            return {"received": True}

        payment = res.json()
    except httpx.RequestError as e:
        logger.error("Error de conexión al consultar pago: %s", e)
        return {"received": True}

    preference_id = payment.get("preference_id")
    status_mp = payment.get("status")  # approved, rejected, in_process, etc.

    if not preference_id:
        logger.warning("Pago %s no tiene preference_id", resource_id)
        return {"received": True}

    # Buscar la orden por mp_preference_id
    result = await db.execute(
        select(Order).where(Order.mp_preference_id == preference_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        logger.warning("No se encontró orden con preference_id %s", preference_id)
        return {"received": True}

    # Mapear estado de MP a estado interno
    mp_to_order_status = {
        "approved": "PENDING",       # Sigue PENDING hasta que el negocio lo acepte
        "rejected": "CANCELLED",
        "refunded": "CANCELLED",
        "charged_back": "CANCELLED",
        "cancelled": "CANCELLED",
        "in_process": "PENDING",
        "pending": "PENDING",
    }

    order.mp_payment_status = status_mp
    if status_mp in mp_to_order_status:
        from app.models.models import OrderStatus
        mapped = mp_to_order_status[status_mp]
        if mapped == "CANCELLED" and order.status != OrderStatus.CANCELLED:
            order.status = OrderStatus.CANCELLED
            order.cancelled_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
            order.cancel_reason = f"Pago {status_mp} por Mercado Pago"

    await db.commit()
    logger.info("Orden #%s actualizada: mp_status=%s", order.order_number, status_mp)

    return {"received": True}

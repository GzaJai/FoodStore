import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.models import Client
from app.schemas.schemas import ClientCreate, ClientUpdate, ClientResponse
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/clients", tags=["6. Clientes"])


@router.get(
    "",
    response_model=list[ClientResponse],
    summary="Listar clientes",
    description="Lista clientes con filtros por categoría, búsqueda y estado de afiliación.",
)
async def list_clients(
    category_id: str | None = Query(None, description="Filtrar por categoría"),
    search: str | None = Query(None, description="Buscar por nombre, email o teléfono"),
    affiliated: bool | None = Query(None, description="Filtrar por afiliación"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    query = select(Client)
    if category_id:
        query = query.where(Client.client_category_id == category_id)
    if search:
        query = query.where(
            (Client.name.ilike(f"%{search}%")) |
            (Client.email.ilike(f"%{search}%")) |
            (Client.phone.ilike(f"%{search}%"))
        )
    if affiliated is not None:
        query = query.where(Client.is_affiliated == affiliated)

    result = await db.execute(query.order_by(Client.name))
    return [ClientResponse.model_validate(c) for c in result.scalars().all()]


@router.post(
    "",
    response_model=ClientResponse,
    status_code=201,
    summary="Crear cliente",
    description="Registra un nuevo cliente en el sistema.",
)
async def create_client(
    body: ClientCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    client = Client(
        id=str(uuid.uuid4()),
        name=body.name,
        email=body.email,
        phone=body.phone,
        address=body.address,
        is_affiliated=body.is_affiliated,
        client_category_id=body.client_category_id,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return ClientResponse.model_validate(client)


@router.patch(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Actualizar cliente",
    description="Actualiza los datos de un cliente existente.",
)
async def update_client(
    client_id: str,
    body: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)
    return ClientResponse.model_validate(client)

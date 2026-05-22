import uuid
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.database import get_db
from app.models.models import ClientCategory, Client, UserRole
from app.schemas.schemas import ClientCategoryCreate, ClientCategoryUpdate, ClientCategoryResponse
from app.core.auth import get_current_user, require_role
from app.config.settings import settings
import os

router = APIRouter(prefix="/api/categories/client", tags=["5. Categorías de Clientes"])


@router.get(
    "",
    response_model=list[ClientCategoryResponse],
    summary="Listar categorías de clientes",
    description="Lista todas las categorías de clientes con su conteo de clientes asignados.",
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(ClientCategory).order_by(ClientCategory.sort_order, ClientCategory.name)
    )
    categories = result.scalars().all()

    responses = []
    for cat in categories:
        count_result = await db.execute(
            select(func.count(Client.id)).where(Client.client_category_id == cat.id)
        )
        cat.client_count = count_result.scalar() or 0
        responses.append(ClientCategoryResponse.model_validate(cat))

    return responses


@router.post(
    "",
    response_model=ClientCategoryResponse,
    status_code=201,
    summary="Crear categoría",
    description="Crea una nueva categoría de clientes. Requiere rol ADMIN.",
)
async def create_category(
    body: ClientCategoryCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    category = ClientCategory(
        id=str(uuid.uuid4()),
        key=body.key,
        name=body.name,
        icon=body.icon,
        color=body.color,
        sort_order=body.sort_order,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return ClientCategoryResponse.model_validate(category)


@router.patch(
    "/{category_id}",
    response_model=ClientCategoryResponse,
    summary="Actualizar categoría",
    description="Actualiza los datos de una categoría. Requiere rol ADMIN.",
)
async def update_category(
    category_id: str,
    body: ClientCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(ClientCategory).where(ClientCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return ClientCategoryResponse.model_validate(category)


@router.post(
    "/{category_id}/logo",
    summary="Subir logo de categoría",
    description="Sube una imagen como logo para la categoría. Requiere rol ADMIN.",
    responses={
        200: {"description": "Logo subido exitosamente"},
        404: {"description": "Categoría no encontrada"},
    },
)
async def upload_logo(
    category_id: str,
    file: UploadFile = File(..., description="Archivo de imagen (PNG, JPG, SVG)"),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(ClientCategory).where(ClientCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{category_id}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    category.logo = f"/uploads/{filename}"
    await db.commit()

    return {"success": True, "logo_url": category.logo}

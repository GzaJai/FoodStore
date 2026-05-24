import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.database import get_db
from app.models.models import Ingredient, Product, ProductIngredient, UserRole
from app.schemas.schemas import (
    IngredientCreate, IngredientUpdate, IngredientResponse,
    IngredientPage, PaginationMeta,
)
from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/ingredients", tags=["6. Ingredientes"])


@router.get(
    "",
    response_model=IngredientPage,
    summary="Listar ingredientes",
    description="Lista paginada de ingredientes. Se puede filtrar por búsqueda textual.",
)
async def list_ingredients(
    search: str | None = Query(None, description="Buscar por nombre"),
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Ingredientes por página"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    query = select(Ingredient)
    count_query = select(func.count(Ingredient.id))

    if search:
        query = query.where(Ingredient.name.ilike(f"%{search}%"))
        count_query = count_query.where(Ingredient.name.ilike(f"%{search}%"))

    # Count total
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    result = await db.execute(
        query.order_by(Ingredient.name).offset(offset).limit(per_page)
    )
    items = [IngredientResponse.model_validate(i) for i in result.scalars().all()]

    return IngredientPage(
        items=items,
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=max(1, (total + per_page - 1) // per_page),
        ),
    )


@router.post(
    "",
    response_model=IngredientResponse,
    status_code=201,
    summary="Crear ingrediente",
    description="Crea un nuevo ingrediente. Requiere rol ADMIN.",
)
async def create_ingredient(
    body: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    existing = await db.execute(select(Ingredient).where(Ingredient.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un ingrediente con ese nombre",
        )

    ingredient = Ingredient(
        id=str(uuid.uuid4()),
        name=body.name,
        is_allergen=body.is_allergen,
    )
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return IngredientResponse.model_validate(ingredient)


@router.patch(
    "/{ingredient_id}",
    response_model=IngredientResponse,
    summary="Actualizar ingrediente",
    description="Actualiza los datos de un ingrediente. Requiere rol ADMIN.",
)
async def update_ingredient(
    ingredient_id: str,
    body: IngredientUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ingredient, field, value)

    await db.commit()
    await db.refresh(ingredient)
    return IngredientResponse.model_validate(ingredient)


@router.delete(
    "/{ingredient_id}",
    summary="Eliminar ingrediente",
    description="Elimina un ingrediente. Requiere rol ADMIN. Falla si está siendo usado por algún producto.",
)
async def delete_ingredient(
    ingredient_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")

    # Verificar si está en uso
    usage = await db.execute(
        select(func.count(ProductIngredient.product_id)).where(
            ProductIngredient.ingredient_id == ingredient_id
        )
    )
    if usage.scalar() or 0 > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el ingrediente porque está siendo usado por uno o más productos",
        )

    await db.delete(ingredient)
    await db.commit()
    return {"success": True, "message": "Ingrediente eliminado"}

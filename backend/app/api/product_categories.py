import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.database import get_db
from app.models.models import ProductCategoryDef, Product, UserRole
from app.schemas.schemas import ProductCategoryCreate, ProductCategoryUpdate, ProductCategoryResponse
from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/product-categories", tags=["4. Categorías de Productos"])


@router.get(
    "",
    response_model=list[ProductCategoryResponse],
    summary="Listar categorías de productos",
    description="Lista todas las categorías de productos con su conteo de productos asignados.",
)
async def list_product_categories(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(ProductCategoryDef).order_by(ProductCategoryDef.name)
    )
    categories = result.scalars().all()

    # Build a set of category IDs that are parents (have children)
    parent_ids = {c.parent_id for c in categories if c.parent_id}

    responses = []
    for cat in categories:
        count_result = await db.execute(
            select(func.count(Product.id)).where(Product.category_id == cat.id)
        )
        responses.append(ProductCategoryResponse(
            id=cat.id,
            name=cat.name,
            key=cat.key,
            color=cat.color,
            parent_id=cat.parent_id,
            is_active=cat.is_active,
            product_count=count_result.scalar() or 0,
        ))

    return responses


async def _validate_parent_id(body, db: AsyncSession, category_id: str | None = None) -> None:
    """Valida que el parent_id exista, no sea auto-referencia y no cree ciclos."""
    if body.parent_id is None:
        return

    # Verificar que el padre exista
    parent = await db.execute(
        select(ProductCategoryDef).where(ProductCategoryDef.id == body.parent_id)
    )
    if not parent.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La categoría padre no existe",
        )

    # No puede ser auto-referencia
    if category_id and body.parent_id == category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una categoría no puede ser padre de sí misma",
        )


@router.post(
    "",
    response_model=ProductCategoryResponse,
    status_code=201,
    summary="Crear categoría de producto",
    description="Crea una nueva categoría de producto. Requiere rol ADMIN.",
)
async def create_product_category(
    body: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    # Verificar que no exista una categoría con el mismo key
    existing = await db.execute(
        select(ProductCategoryDef).where(ProductCategoryDef.key == body.key.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una categoría con el key '{body.key.upper()}'",
        )

    await _validate_parent_id(body, db)

    category = ProductCategoryDef(
        id=str(uuid.uuid4()),
        name=body.name,
        key=body.key.upper(),
        color=body.color,
        parent_id=body.parent_id,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    count_result = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category.id)
    )
    return ProductCategoryResponse(
        id=category.id,
        name=category.name,
        key=category.key,
        color=category.color,
        parent_id=category.parent_id,
        is_active=category.is_active,
        product_count=count_result.scalar() or 0,
    )


@router.patch(
    "/{category_id}",
    response_model=ProductCategoryResponse,
    summary="Actualizar categoría de producto",
    description="Actualiza los datos de una categoría. Requiere rol ADMIN.",
)
async def update_product_category(
    category_id: str,
    body: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(ProductCategoryDef).where(ProductCategoryDef.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )

    await _validate_parent_id(body, db, category_id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    count_result = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category.id)
    )

    return ProductCategoryResponse(
        id=category.id,
        name=category.name,
        key=category.key,
        color=category.color,
        parent_id=category.parent_id,
        is_active=category.is_active,
        product_count=count_result.scalar() or 0,
    )


@router.delete(
    "/{category_id}",
    summary="Desactivar categoría de producto",
    description="Desactiva una categoría (soft delete). Requiere rol ADMIN. No se puede desactivar si tiene productos activos o subcategorías activas.",
)
async def deactivate_product_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(ProductCategoryDef).where(ProductCategoryDef.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )

    # Verificar si tiene subcategorías activas
    children_result = await db.execute(
        select(func.count(ProductCategoryDef.id)).where(
            ProductCategoryDef.parent_id == category_id,
            ProductCategoryDef.is_active == True,
        )
    )
    active_children = children_result.scalar() or 0
    if active_children > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede desactivar la categoría porque tiene {active_children} subcategoría(s) activa(s). Desactivá las subcategorías primero.",
        )

    # Verificar si hay productos activos en esta categoría
    count_result = await db.execute(
        select(func.count(Product.id)).where(
            Product.category_id == category_id,
            Product.is_active == True,
        )
    )
    active_products = count_result.scalar() or 0
    if active_products > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede desactivar la categoría porque tiene {active_products} producto(s) activo(s). Desactivá los productos primero.",
        )

    category.is_active = False
    await db.commit()
    return {"success": True, "message": "Categoría desactivada"}

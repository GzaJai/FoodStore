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

    responses = []
    for cat in categories:
        count_result = await db.execute(
            select(func.count(Product.id)).where(Product.category_id == cat.id)
        )
        cat.product_count = count_result.scalar() or 0
        responses.append(ProductCategoryResponse.model_validate(cat))

    return responses


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

    category = ProductCategoryDef(
        id=str(uuid.uuid4()),
        name=body.name,
        key=body.key.upper(),
        color=body.color,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return ProductCategoryResponse.model_validate(category)


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

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    # Recalcular product_count
    count_result = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category.id)
    )
    category.product_count = count_result.scalar() or 0

    return ProductCategoryResponse.model_validate(category)


@router.delete(
    "/{category_id}",
    summary="Desactivar categoría de producto",
    description="Desactiva una categoría (soft delete). Requiere rol ADMIN. No se puede desactivar si tiene productos activos.",
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

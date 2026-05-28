from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from app.config.database import get_db
from app.models.models import Product, ProductCategoryDef, Ingredient, UserRole
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse, ProductPage, PaginationMeta
from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/products", tags=["3. Productos"])


@router.get(
    "",
    response_model=ProductPage,
    summary="Listar productos",
    description="Lista paginada de productos. Se puede filtrar por categoría, búsqueda textual y estado.",
)
async def list_products(
    category_id: str | None = Query(None, description="Filtrar por ID de categoría"),
    search: str | None = Query(None, description="Buscar por nombre"),
    active: bool = Query(True, description="Solo productos activos"),
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Productos por página"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    query = (
        select(Product)
        .options(joinedload(Product.category_ref), joinedload(Product.ingredients))
        .where(Product.is_active == active)
    )
    if category_id:
        query = query.where(Product.category_id == category_id)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(Product).where(Product.is_active == active)
    if category_id:
        count_query = count_query.where(Product.category_id == category_id)
    if search:
        count_query = count_query.where(Product.name.ilike(f"%{search}%"))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(Product.name).offset(offset).limit(per_page))
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


@router.post(
    "",
    response_model=ProductResponse,
    status_code=201,
    summary="Crear producto",
    description="Crea un nuevo producto. Requiere rol ADMIN o MANAGER.",
)
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    # Validar que la categoría exista
    cat_result = await db.execute(
        select(ProductCategoryDef).where(ProductCategoryDef.id == body.category_id)
    )
    if not cat_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoría no encontrada",
        )

    product = Product(
        id=str(__import__("uuid").uuid4()),
        name=body.name,
        description=body.description,
        price=body.price,
        category_id=body.category_id,
        prep_time_min=body.prep_time_min,
    )
    db.add(product)

    # Asociar ingredientes
    if body.ingredient_ids:
        result = await db.execute(
            select(Ingredient).where(Ingredient.id.in_(body.ingredient_ids))
        )
        ingredient_list = result.scalars().all()
        # Usamos run_sync para evitar MissingGreenlet al setear la relación
        await db.run_sync(lambda _: setattr(product, "ingredients", ingredient_list))

    await db.commit()
    await db.refresh(product)

    # Recargar con relaciones para la response
    result = await db.execute(
        select(Product)
        .options(joinedload(Product.category_ref), joinedload(Product.ingredients))
        .where(Product.id == product.id)
    )
    product = result.unique().scalar_one()
    return ProductResponse.model_validate(product)


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Actualizar producto",
    description="Actualiza los campos de un producto. Requiere rol ADMIN o MANAGER.",
)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(
        select(Product)
        .options(joinedload(Product.category_ref))
        .where(Product.id == product_id)
    )
    product = result.unique().scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    ingredient_ids = update_data.pop("ingredient_ids", None)

    for field, value in update_data.items():
        setattr(product, field, value)

    # Actualizar ingredientes si se enviaron
    if ingredient_ids is not None:
        result = await db.execute(
            select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
        )
        ingredient_list = result.scalars().all()
        # Usamos run_sync para evitar MissingGreenlet al setear la relación
        await db.run_sync(lambda _: setattr(product, "ingredients", ingredient_list))

    await db.commit()
    await db.refresh(product)

    # Recargar con relaciones
    result = await db.execute(
        select(Product)
        .options(joinedload(Product.category_ref), joinedload(Product.ingredients))
        .where(Product.id == product.id)
    )
    product = result.unique().scalar_one()
    return ProductResponse.model_validate(product)


@router.delete(
    "/{product_id}",
    summary="Desactivar producto",
    description="Desactiva un producto (soft delete). Requiere rol ADMIN o MANAGER.",
)
async def deactivate_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    product.is_active = False
    await db.commit()
    return {"success": True, "message": "Producto desactivado"}

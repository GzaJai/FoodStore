from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.models import Product, ProductCategory, UserRole
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/products", tags=["3. Productos"])


@router.get(
    "",
    response_model=list[ProductResponse],
    summary="Listar productos",
    description="Lista todos los productos activos. Se puede filtrar por categoría, búsqueda textual y estado.",
)
async def list_products(
    category: ProductCategory | None = Query(None, description="Filtrar por categoría"),
    search: str | None = Query(None, description="Buscar por nombre"),
    active: bool = Query(True, description="Solo productos activos"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    query = select(Product).where(Product.is_active == active)
    if category:
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    result = await db.execute(query.order_by(Product.name))
    return [ProductResponse.model_validate(p) for p in result.scalars().all()]


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
    product = Product(
        id=str(__import__("uuid").uuid4()),
        name=body.name,
        description=body.description,
        price=body.price,
        category=body.category,
        prep_time_min=body.prep_time_min,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
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
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
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

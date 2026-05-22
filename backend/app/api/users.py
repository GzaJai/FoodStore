from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, UserUpdate, PasswordChange, MessageResponse
from app.core.auth import get_current_user
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/api/users", tags=["2. Usuarios y Perfil"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Ver mi perfil",
    description="Obtiene la información personal del usuario autenticado.",
)
async def get_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Actualizar perfil",
    description="Actualiza el nombre y/o teléfono del usuario autenticado.",
)
async def update_profile(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.name is not None:
        user.name = body.name
    if body.phone is not None:
        user.phone = body.phone
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch(
    "/me/password",
    response_model=MessageResponse,
    summary="Cambiar contraseña",
    description="Cambia la contraseña del usuario autenticado. Requiere la contraseña actual.",
    responses={
        200: {"description": "Contraseña actualizada"},
        400: {"description": "Contraseña actual incorrecta"},
    },
)
async def change_password(
    body: PasswordChange,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta",
        )
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return MessageResponse(success=True, message="Contraseña actualizada")

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import LoginRequest, LoginResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["1. Autenticación"])


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Iniciar sesión",
    description="Autentica un usuario con email y contraseña. Devuelve un JWT token y los datos del usuario.",
    responses={
        200: {"description": "Login exitoso"},
        401: {"description": "Credenciales inválidas"},
        403: {"description": "Usuario desactivado"},
    },
)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Autentica al usuario y genera un token JWT.

    - **email**: Email registrado en el sistema
    - **password**: Contraseña del usuario
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role.value})

    return LoginResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener usuario actual",
    description="Devuelve los datos del usuario autenticado según el token JWT.",
    responses={
        200: {"description": "Datos del usuario"},
        401: {"description": "No autenticado"},
    },
)
async def get_me(user: User = Depends(get_current_user)):
    """Requiere autenticación con JWT."""
    return UserResponse.model_validate(user)

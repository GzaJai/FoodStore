from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config.settings import settings
from app.api import auth, users, products, orders, categories, clients, dashboard
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await seed_database()
    yield
    # Shutdown


app = FastAPI(
    title="FoodStore API",
    version=settings.APP_VERSION,
    description="API REST para el sistema de gestión gastronómica FoodStore. Incluye autenticación, gestión de pedidos, productos, clientes y dashboard en tiempo real.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(clients.router)
app.include_router(dashboard.router)

# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

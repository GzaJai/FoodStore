import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config.settings import settings
from app.api import auth, users, products, orders, categories, clients, dashboard, public, product_categories, ingredients, webhooks
from app.seed import seed_database
from app.ws.manager import manager

logger = logging.getLogger("foodstore")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await seed_database()
    logger.info("WebSocket manager listo — %d conexiones activas", manager.connections_count)
    yield
    # Shutdown — limpiar conexiones
    logger.info("Servidor deteniéndose, %d conexiones WS cerradas", manager.connections_count)


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
    max_age=0,
)

# Routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(product_categories.router)
app.include_router(clients.router)
app.include_router(dashboard.router)
app.include_router(public.router)
app.include_router(ingredients.router)
app.include_router(webhooks.router)

# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


# ─── WebSocket ──────────────────────────────────────────


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint para tiempo real.
    Los clientes se conectan y reciben eventos de actualización de pedidos.

    Eventos emitidos:
    - order_created:   se creó un nuevo pedido
    - order_updated:   cambió el estado de un pedido
    - order_deleted:   se canceló/eliminó un pedido (no implementado aún)

    Formato:
    ```json
    {
      "type": "order_created",
      "payload": { "order_id": 123, "order_number": "FS-20260522-ABC123" }
    }
    ```
    """
    await manager.connect(websocket)
    try:
        # Mantenemos la conexión abierta. receive_text() bloquea hasta
        # que el cliente envía algo o se desconecta.
        # Podríamos usarlo en el futuro si el cliente quiere enviar
        # mensajes (ej. "join a room"), por ahora solo escuchamos.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

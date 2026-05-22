"""
FoodStore API — Runner Script
==============================
Inicia el servidor FastAPI con uvicorn, logs en consola y auto-reload en desarrollo.

Uso:
    python run.py              # Desarrollo (reload + debug)
    python run.py --prod       # Producción (sin reload, 4 workers)
    python run.py --port 8080  # Puerto personalizado
"""

import sys
import logging
import uvicorn
from app.config.settings import settings

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("foodstore")


def main():
    is_prod = "--prod" in sys.argv

    # Parsear puerto personalizado
    port = 3000
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            try:
                port = int(sys.argv[i + 1])
            except ValueError:
                logger.error(f"Puerto inválido: {sys.argv[i + 1]}")
                sys.exit(1)

    logger.info("=" * 60)
    logger.info("  FoodStore API — Iniciando servidor")
    logger.info("=" * 60)
    logger.info(f"  Entorno:    {'PRODUCCIÓN' if is_prod else 'DESARROLLO'}")
    logger.info(f"  Puerto:     {port}")
    logger.info(f"  Debug:      {settings.DEBUG}")
    logger.info(f"  Database:   {settings.DATABASE_URL.split('://')[0]}://***")
    logger.info(f"  Docs:       http://localhost:{port}/docs")
    logger.info(f"  ReDoc:      http://localhost:{port}/redoc")
    logger.info("=" * 60)

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=not is_prod and settings.DEBUG,
        reload_dirs=["app"] if not is_prod else None,
        log_level="debug" if settings.DEBUG else "info",
        access_log=True,
        workers=1 if not is_prod else 4,
    )


if __name__ == "__main__":
    main()

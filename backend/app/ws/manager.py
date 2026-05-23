"""
ConnectionManager for WebSocket real-time updates.

Mantiene conexiones activas y permite broadcast de eventos
a todos los clientes conectados (paneles de pedidos, cocina, etc).

Uso:
    from app.ws.manager import manager

    # En un endpoint:
    await manager.broadcast({
        "type": "order_created",
        "payload": {"order_id": 123, "order_number": "FS-..."}
    })
"""

import json
import logging
from fastapi import WebSocket

logger = logging.getLogger("foodstore.ws")


class ConnectionManager:
    """Maneja conexiones WebSocket activas y broadcast de eventos."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Acepta una nueva conexión WebSocket y la registra."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("Cliente WS conectado (%d activos)", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        """Remueve una conexión WebSocket de la lista activa."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("Cliente WS desconectado (%d activos)", len(self.active_connections))

    async def broadcast(self, message: dict) -> None:
        """
        Envía un mensaje JSON a TODAS las conexiones activas.
        Remueve automáticamente conexiones muertas.
        """
        dead: list[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)

        for conn in dead:
            self.disconnect(conn)

    @property
    def connections_count(self) -> int:
        return len(self.active_connections)


# Singleton global — importás esto donde necesites broadcast
manager = ConnectionManager()

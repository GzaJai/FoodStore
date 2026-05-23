import { useEffect, useRef, useCallback } from 'react'

export type WSEventType = 'order_created' | 'order_updated' | 'order_deleted'

export interface WSMessage {
  type: WSEventType
  payload: {
    order_id: number
    order_number: string
    status?: string
  }
}

export type WSStatus = 'connecting' | 'connected' | 'disconnected'

interface UseWebSocketOptions {
  onMessage: (msg: WSMessage) => void
  onStatusChange?: (status: WSStatus) => void
  reconnectInterval?: number
  maxRetries?: number
}

export function useWebSocket({
  onMessage,
  onStatusChange,
  reconnectInterval = 3000,
  maxRetries = Infinity,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  const onStatusChangeRef = useRef(onStatusChange)

  onMessageRef.current = onMessage
  onStatusChangeRef.current = onStatusChange

  const setStatus = useCallback((status: WSStatus) => {
    onStatusChangeRef.current?.(status)
  }, [])

  useEffect(() => {
    function getWsUrl(): string {
      const explicit = import.meta.env.VITE_WS_URL
      if (explicit) return explicit

      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        return apiUrl.replace(/^http/, 'ws') + '/ws'
      }

      const origin = window.location.origin.replace(/^http/, 'ws')
      return origin + '/ws'
    }

    const wsUrl = getWsUrl()

    function connect() {
      wsRef.current?.close()

      setStatus('connecting')
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        retriesRef.current = 0
        setStatus('connected')
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as WSMessage
          onMessageRef.current(data)
        } catch {
          console.warn('[WS] Mensaje inválido recibido:', event.data)
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        wsRef.current = null

        if (retriesRef.current < maxRetries) {
          retriesRef.current++
          timerRef.current = setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      timerRef.current && clearTimeout(timerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [reconnectInterval, maxRetries, setStatus])
}

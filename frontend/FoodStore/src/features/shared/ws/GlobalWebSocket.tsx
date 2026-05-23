import { useCallback, useEffect } from 'react'
import { useOrderStore } from '../../../stores/orderStore'
import { useUIStore } from '../../../stores/uiStore'
import { useWebSocket, type WSMessage } from '../hooks/useWebSocket'

export function GlobalWebSocket() {
  const fetchOrders = useOrderStore((s) => s.fetchOrders)
  const setWsStatus = useUIStore((s) => s.setWsStatus)
  const bumpTick = useUIStore((s) => s.bumpTick)

  const handleMessage = useCallback(
    (_msg: WSMessage) => {
      fetchOrders()
    },
    [fetchOrders],
  )

  useWebSocket({
    onMessage: handleMessage,
    onStatusChange: setWsStatus,
  })

  useEffect(() => {
    const timer = setInterval(bumpTick, 30000)
    return () => clearInterval(timer)
  }, [bumpTick])

  return null
}

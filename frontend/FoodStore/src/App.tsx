import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useOrderStore } from './stores/orderStore'

export default function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const { fetchOrders } = useOrderStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated, fetchOrders])

  return <Outlet />
}

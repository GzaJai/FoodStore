import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import Layout from './components/layout/Layout'
import Login from './views/Login'
import Dashboard from './views/Dashboard'
import OrderManagement from './views/OrderManagement'
import KDS from './views/KDS'
import ClientLogoCatalog from './views/ClientLogoCatalog'
import Profile from './views/Profile'

export default function App() {
  const { currentView } = useUIStore()
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated && currentView !== 'login') {
    return <Login />
  }

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login />
      case 'dashboard':
        return <Dashboard />
      case 'orders':
        return <OrderManagement />
      case 'kds':
        return <KDS />
      case 'client-logos':
        return <ClientLogoCatalog />
      case 'profile':
        return <Profile />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout>
      {renderView()}
    </Layout>
  )
}

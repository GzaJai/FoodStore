import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import ProtectedRoute, { DefaultRoute } from './features/auth/components/ProtectedRoute'
import Layout from './features/shared/layout/Layout'
import Login from './features/auth/Login'
import PublicMenu from './features/public/PublicMenu'
import Dashboard from './features/dashboard/Dashboard'
import OrderManagement from './features/orders/OrderManagement'
import KDS from './features/kitchen/KDS'
import ClientLogoCatalog from './features/clients/ClientLogoCatalog'
import DeliveryView from './features/delivery/DeliveryView'
import Profile from './features/profile/Profile'
import Products from './features/products/Products'
import ProductCategories from './features/products/ProductCategories'
import Ingredients from './features/ingredients/Ingredients'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: '/',
        element: <PublicMenu />,
      },
      {
        path: '/negocio/login',
        element: <Login />,
      },
      {
        path: '/negocio',
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DefaultRoute /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'pedidos', element: <OrderManagement /> },
          { path: 'cocina', element: <KDS /> },
          { path: 'reparto', element: <DeliveryView /> },
          { path: 'productos', element: <Products /> },
          { path: 'categorias', element: <ProductCategories /> },
          { path: 'ingredientes', element: <Ingredients /> },
          { path: 'clientes', element: <ClientLogoCatalog /> },
          { path: 'perfil', element: <Profile /> },
        ],
      },
    ],
  },
])

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { initMercadoPago } from '@mercadopago/sdk-react'
import { router } from './router'
import './index.css'

// Inicializar Mercado Pago SDK con la Public Key
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

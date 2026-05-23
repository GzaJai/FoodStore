import { Outlet } from 'react-router-dom'
import Header from './Header'
import { GlobalWebSocket } from '../ws/GlobalWebSocket'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalWebSocket />
      <Header />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

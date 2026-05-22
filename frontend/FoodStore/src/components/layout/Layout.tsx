import { useUIStore } from '../../stores/uiStore'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { currentView } = useUIStore()

  if (currentView === 'login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  )
}

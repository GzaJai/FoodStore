import { useState } from 'react'
import { Card, CardContent, Button, Badge, EmptyState } from '../components/ui'
import { Upload, Users, Bike, UtensilsCrossed, ShoppingBag, Home, Coffee, Plus, Package } from 'lucide-react'

interface ClientCategory {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
  count: number
  hasLogo: boolean
}

const categories: ClientCategory[] = [
  { id: 'all', name: 'TODOS', icon: <Users size={32} />, color: 'text-gray-700', bgColor: 'bg-gray-100', count: 156, hasLogo: false },
  { id: 'non-affiliated', name: 'NO AFILIADO', icon: <Users size={32} />, color: 'text-gray-500', bgColor: 'bg-gray-50', count: 23, hasLogo: false },
  { id: 'delivery', name: 'DELIVERY', icon: <Bike size={32} />, color: 'text-blue-700', bgColor: 'bg-blue-50', count: 45, hasLogo: true },
  { id: 'tables', name: 'MESAS', icon: <UtensilsCrossed size={32} />, color: 'text-green-700', bgColor: 'bg-green-50', count: 38, hasLogo: true },
  { id: 'dine-in', name: 'DINE IN', icon: <Coffee size={32} />, color: 'text-yellow-700', bgColor: 'bg-yellow-50', count: 28, hasLogo: true },
  { id: 'takeaway', name: 'TAKE AWAY', icon: <ShoppingBag size={32} />, color: 'text-purple-700', bgColor: 'bg-purple-50', count: 15, hasLogo: true },
  { id: 'fixed-address', name: 'DOMICILIO FIJO', icon: <Home size={32} />, color: 'text-gray-600', bgColor: 'bg-gray-100', count: 7, hasLogo: false },
]

export default function ClientLogoCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const selectedCat = categories.find((c) => c.id === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cat. Logo de Clientes</h1>
          <p className="text-gray-500 text-sm">Gestioná los logos y categorías de clientes</p>
        </div>
        <Badge variant="default" size="md">LOCAL</Badge>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`${cat.bgColor} border-2 ${
              selectedCategory === cat.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
            } rounded-xl p-6 hover:shadow-lg transition-all group text-left`}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-20 h-20 rounded-xl ${cat.bgColor} ${cat.color} flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-orange-400 transition-colors`}>
                {cat.hasLogo ? (
                  cat.icon
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-xs text-gray-400">Subir logo</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className={`font-semibold ${cat.color}`}>{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.count} clientes</p>
              </div>

              {cat.hasLogo ? (
                <Badge variant="success">Logo configurado</Badge>
              ) : (
                <Badge variant="neutral">Sin logo</Badge>
              )}
            </div>
          </button>
        ))}

        {/* Nueva categoría */}
        <button className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Plus size={24} className="text-gray-400" />
          </div>
          <span className="text-sm text-gray-500 font-medium">Nueva Categoría</span>
        </button>
      </div>

      {/* Detalle de categoría seleccionada */}
      {selectedCat && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Clientes - {selectedCat.name}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                Cerrar
              </Button>
            </div>
            <EmptyState
              icon={Package}
              title="Vista de detalle"
              description={`Aquí se listarían los ${selectedCat.count} clientes asignados a ${selectedCat.name}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

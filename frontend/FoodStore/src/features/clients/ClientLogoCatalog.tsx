import { useEffect, useState } from 'react'
import { Card, CardContent, Button, Badge, EmptyState } from '../shared/ui'
import { Upload, Users, Bike, UtensilsCrossed, ShoppingBag, Home, Coffee, Plus, Package, Loader2 } from 'lucide-react'
import { listClientCategoriesApi } from '../../api/clients'
import { mapClientCategory, type ClientCategoryData } from '../../api/mappers'

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={32} />,
  Bike: <Bike size={32} />,
  UtensilsCrossed: <UtensilsCrossed size={32} />,
  Coffee: <Coffee size={32} />,
  ShoppingBag: <ShoppingBag size={32} />,
  Home: <Home size={32} />,
}

const colorMap: Record<string, string> = {
  '#6b7280': 'text-gray-700',
  '#9ca3af': 'text-gray-500',
  '#3b82f6': 'text-blue-700',
  '#10b981': 'text-green-700',
  '#f59e0b': 'text-yellow-700',
  '#8b5cf6': 'text-purple-700',
}

const bgColorMap: Record<string, string> = {
  '#6b7280': 'bg-gray-100',
  '#9ca3af': 'bg-gray-50',
  '#3b82f6': 'bg-blue-50',
  '#10b981': 'bg-green-50',
  '#f59e0b': 'bg-yellow-50',
  '#8b5cf6': 'bg-purple-50',
}

export default function ClientLogoCatalog() {
  const [categories, setCategories] = useState<ClientCategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    listClientCategoriesApi()
      .then((apiCats) => {
        setCategories(apiCats.map(mapClientCategory))
      })
      .catch(() => {
      })
      .finally(() => setIsLoading(false))
  }, [])

  const selectedCat = categories.find((c) => c.id === selectedCategory)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cat. Logo de Clientes</h1>
          <p className="text-gray-500 text-sm">Gestioná los logos y categorías de clientes</p>
        </div>
        <Badge variant="default" size="md">LOCAL</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const colorClass = colorMap[cat.color ?? ''] ?? 'text-gray-700'
          const bgClass = bgColorMap[cat.color ?? ''] ?? 'bg-gray-100'

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`${bgClass} border-2 ${
                selectedCategory === cat.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
              } rounded-xl p-6 hover:shadow-lg transition-all group text-left`}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-20 h-20 rounded-xl ${bgClass} ${colorClass} flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-orange-400 transition-colors`}>
                  {cat.logo ? (
                    <img src={cat.logo} alt={cat.name} className="w-full h-full object-contain rounded-xl" />
                  ) : cat.icon && iconMap[cat.icon] ? (
                    iconMap[cat.icon]
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                      <span className="text-xs text-gray-400">Subir logo</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className={`font-semibold ${colorClass}`}>{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.clientCount} clientes</p>
                </div>

                {cat.logo ? (
                  <Badge variant="success">Logo configurado</Badge>
                ) : (
                  <Badge variant="neutral">Sin logo</Badge>
                )}
              </div>
            </button>
          )
        })}

        <button className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Plus size={24} className="text-gray-400" />
          </div>
          <span className="text-sm text-gray-500 font-medium">Nueva Categoría</span>
        </button>
      </div>

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
              description={`Aquí se listarían los ${selectedCat.clientCount} clientes asignados a ${selectedCat.name}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

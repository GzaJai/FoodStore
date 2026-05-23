import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, Button, Input, Select, Modal, ModalFooter, Badge, EmptyState, SearchInput,
} from '../shared/ui'
import {
  Plus, Package, Search, Edit3, Trash2, X, Loader2, AlertTriangle,
} from 'lucide-react'
import { listProductsApi, createProductApi, updateProductApi, deactivateProductApi } from '../../api/products'
import { listProductCategoriesApi } from '../../api/productCategories'
import type { ApiProductResponse, ApiProductCategoryResponse } from '../../types/api'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)
}

interface ProductForm {
  name: string
  description: string
  price: string
  category_id: string
  prep_time_min: string
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  prep_time_min: '',
}

export default function Products() {
  const [products, setProducts] = useState<ApiProductResponse[]>([])
  const [categories, setCategories] = useState<ApiProductCategoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ApiProductResponse | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [prods, cats] = await Promise.all([
        listProductsApi({ search: search || undefined, category_id: filterCategory || undefined }),
        listProductCategoriesApi(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [search, filterCategory])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (product: ApiProductResponse) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      category_id: product.category_id,
      prep_time_min: product.prep_time_min ? String(product.prep_time_min) : '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormError('')

    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) { setFormError('Precio inválido'); return }
    if (!form.category_id) { setFormError('Seleccioná una categoría'); return }

    setSaving(true)
    try {
      if (editingProduct) {
        const updated = await updateProductApi(editingProduct.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: Number(form.price),
          category_id: form.category_id,
          prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : undefined,
        })
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createProductApi({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: Number(form.price),
          category_id: form.category_id,
          prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : undefined,
        })
        setProducts((prev) => [...prev, created])
      }
      setModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    try {
      await deactivateProductApi(deletingId)
      setProducts((prev) => prev.filter((p) => p.id !== deletingId))
      setDeletingId(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al desactivar')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-500 text-sm">Administrá los productos del menú</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="Todas las categorías"
            options={[
              { value: '', label: 'Todas las categorías', disabled: true },
              ...categories
                .filter((c) => c.is_active)
                .map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin productos"
          description={search || filterCategory ? 'No hay productos con esos filtros' : 'Todavía no hay productos creados'}
          action={
            !search && !filterCategory ? (
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
                Crear producto
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Prep. (min)</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[250px]">{product.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral" size="sm">{product.category_name}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {product.prep_time_min ? `${product.prep_time_min} min` : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={product.is_active ? 'success' : 'neutral'} size="sm">
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(product)}
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </Button>
                          {product.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(product.id)}
                              title="Desactivar"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
        description={editingProduct ? `Editando ${editingProduct.name}` : 'Completá los datos del producto'}
        size="lg"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Hamburguesa Clásica"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción del producto"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                min={0}
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo prep. (min)</label>
              <Input
                type="number"
                value={form.prep_time_min}
                onChange={(e) => setForm({ ...form, prep_time_min: e.target.value })}
                placeholder="15"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <Select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              placeholder="Seleccionar categoría"
              options={[
                { value: '', label: 'Seleccionar categoría', disabled: true },
                ...categories
                  .filter((c) => c.is_active)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Desactivar producto"
        description="¿Estás seguro de desactivar este producto? No aparecerá en el menú público ni en pedidos nuevos."
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={deleteLoading}>
              Desactivar
            </Button>
          </ModalFooter>
        }
      />
    </div>
  )
}

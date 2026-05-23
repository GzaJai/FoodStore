import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, Button, Input, Modal, ModalFooter, Badge, EmptyState,
} from '../shared/ui'
import {
  Plus, Package, Edit3, Trash2, Loader2, AlertTriangle,
} from 'lucide-react'
import {
  listProductCategoriesApi,
  createProductCategoryApi,
  updateProductCategoryApi,
  deactivateProductCategoryApi,
} from '../../api/productCategories'
import type { ApiProductCategoryResponse } from '../../types/api'

const colorOptions = [
  { value: '#f97316', label: 'Naranja' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Púrpura' },
  { value: '#10b981', label: 'Verde' },
  { value: '#06b6d4', label: 'Cian' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#84cc16', label: 'Lima' },
  { value: '#6b7280', label: 'Gris' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f59e0b', label: 'Amarillo' },
]

interface CategoryForm {
  name: string
  key: string
  color: string
}

const emptyForm: CategoryForm = {
  name: '',
  key: '',
  color: '#6b7280',
}

export default function ProductCategories() {
  const [categories, setCategories] = useState<ApiProductCategoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ApiProductCategoryResponse | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const cats = await listProductCategoriesApi()
      setCategories(cats)
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (cat: ApiProductCategoryResponse) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      key: cat.key,
      color: cat.color ?? '#6b7280',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormError('')

    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return }
    if (!editing && !form.key.trim()) { setFormError('El key es obligatorio'); return }

    setSaving(true)
    try {
      if (editing) {
        const updated = await updateProductCategoryApi(editing.id, {
          name: form.name.trim() || undefined,
          color: form.color || undefined,
        })
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const created = await createProductCategoryApi({
          name: form.name.trim(),
          key: form.key.trim().toUpperCase(),
          color: form.color || undefined,
        })
        setCategories((prev) => [...prev, created])
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
    setDeleteError('')
    try {
      await deactivateProductCategoryApi(deletingId)
      setCategories((prev) => prev.filter((c) => c.id !== deletingId))
      setDeletingId(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error al desactivar')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorías de Productos</h1>
          <p className="text-gray-500 text-sm">Administrá las categorías del menú</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin categorías"
          description="Todavía no hay categorías de productos creadas"
          action={
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
              Crear categoría
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: cat.color ?? '#6b7280' }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{cat.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} title="Editar">
                      <Edit3 size={15} />
                    </Button>
                    {cat.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(cat.id)}
                        title="Desactivar"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={cat.is_active ? 'success' : 'neutral'} size="sm">
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <span className="text-xs text-gray-500">{cat.product_count} producto(s)</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        description={editing ? `Editando ${editing.name}` : 'Completá los datos de la categoría'}
        size="md"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editing ? 'Guardar cambios' : 'Crear categoría'}
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
              placeholder="Ej: Almuerzos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key * {editing && <span className="text-gray-400 font-normal">(no editable)</span>}
            </label>
            <Input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="Ej: ALMUERZOS"
              disabled={!!editing}
              containerClassName={editing ? 'opacity-60' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, color: opt.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.color === opt.value ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                />
              ))}
              {form.color && !colorOptions.find((c) => c.value === form.color) && (
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-800 scale-110"
                  style={{ backgroundColor: form.color }}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Desactivar categoría"
        description="¿Estás seguro de desactivar esta categoría?"
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={deleteLoading}>
              Desactivar
            </Button>
          </ModalFooter>
        }
      >
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} />
            {deleteError}
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, Button, Input, Modal, ModalFooter, Badge, EmptyState, SearchInput, Pagination,
} from '../shared/ui'
import {
  Plus, Package, Edit3, Trash2, Loader2, AlertTriangle, AlertCircle,
} from 'lucide-react'
import {
  listIngredientsApi,
  createIngredientApi,
  updateIngredientApi,
  deleteIngredientApi,
} from '../../api/ingredients'
import type { ApiIngredientResponse } from '../../types/api'

// ─── Form ──────────────────────────────────────────────────────────────

interface IngredientForm {
  name: string
  is_allergen: boolean
}

const emptyForm: IngredientForm = {
  name: '',
  is_allergen: false,
}

// ─── Main Component ───────────────────────────────────────────────────

export default function Ingredients() {
  // ── Data ──────────────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<ApiIngredientResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Search & Pagination ───────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalIngredients, setTotalIngredients] = useState(0)

  // ── CRUD modal ────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<ApiIngredientResponse | null>(null)
  const [form, setForm] = useState<IngredientForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // ── Delete modal ──────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // ── Data loading ──────────────────────────────────────────────────

  const loadIngredients = useCallback(async (searchTerm: string, pageNum: number) => {
    setIsLoading(true)
    try {
      const result = await listIngredientsApi({
        search: searchTerm || undefined,
        page: pageNum,
        per_page: 20,
      })
      setIngredients(result.items)
      setTotalPages(result.meta.total_pages)
      setTotalIngredients(result.meta.total)
    } catch {
      setIngredients([])
      setTotalPages(1)
      setTotalIngredients(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Reload when search or page changes
  useEffect(() => {
    loadIngredients(search, page)
  }, [search, page, loadIngredients])

  // ── Search handler — resets to page 1 ─────────────────────────────
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  // ── CRUD handlers ─────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setEditingIngredient(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((ingredient: ApiIngredientResponse) => {
    setEditingIngredient(ingredient)
    setForm({
      name: ingredient.name,
      is_allergen: ingredient.is_allergen,
    })
    setFormError('')
    setModalOpen(true)
  }, [])

  const handleSave = async () => {
    setFormError('')

    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      if (editingIngredient) {
        const updated = await updateIngredientApi(editingIngredient.id, {
          name: form.name.trim(),
          is_allergen: form.is_allergen,
        })
        setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await createIngredientApi({
          name: form.name.trim(),
          is_allergen: form.is_allergen,
        })
        // After creating, reload current page to stay in sync
        await loadIngredients(search, page)
      }
      setModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteIngredientApi(deletingId)
      // Reload current page after deletion
      await loadIngredients(search, page)
      setDeletingId(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ingredientes</h1>
          <p className="text-gray-500 text-sm">Administrá los ingredientes y marcá los alérgenos</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          Nuevo ingrediente
        </Button>
      </div>

      {/* Search */}
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin ingredientes"
          description={
            search
              ? 'No hay ingredientes con ese nombre'
              : 'Todavía no hay ingredientes creados'
          }
          action={
            !search ? (
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
                Crear ingrediente
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
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{ingredient.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ingredient.is_allergen ? (
                          <Badge variant="danger" size="sm" dot>
                            Alérgeno
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Normal
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(ingredient)}
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(ingredient.id)}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
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

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          <p className="text-xs text-gray-400">{totalIngredients} ingrediente(s) — página {page} de {totalPages}</p>
        </div>
      )}

      {/* ── Create / Edit modal ────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIngredient ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        description={editingIngredient ? `Editando ${editingIngredient.name}` : 'Completá los datos del ingrediente'}
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editingIngredient ? 'Guardar cambios' : 'Crear ingrediente'}
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
              placeholder="Ej: Gluten, Queso, Lechuga"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_allergen}
                onChange={(e) => setForm({ ...form, is_allergen: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Es alérgeno</span>
                <p className="text-xs text-gray-500">Los productos con este ingrediente mostrarán una advertencia</p>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => { setDeletingId(null); setDeleteError('') }}
        title="Eliminar ingrediente"
        description="¿Estás seguro de eliminar este ingrediente? Esta acción no se puede deshacer."
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => { setDeletingId(null); setDeleteError('') }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteLoading}>
              Eliminar
            </Button>
          </ModalFooter>
        }
      >
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertCircle size={16} />
            {deleteError}
          </div>
        )}
      </Modal>
    </div>
  )
}

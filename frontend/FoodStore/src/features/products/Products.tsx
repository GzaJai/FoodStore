import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card, CardContent, Button, Input, Select, Modal, ModalFooter, Badge, EmptyState, SearchInput, Pagination,
} from '../shared/ui'
import {
  Plus, Package, Edit3, Trash2, Loader2, AlertTriangle, ChevronRight, ChevronDown, FolderOpen, Folder,
} from 'lucide-react'
import { listProductsApi, createProductApi, updateProductApi, deactivateProductApi } from '../../api/products'
import { listProductCategoriesApi } from '../../api/productCategories'
import { listIngredientsApi } from '../../api/ingredients'
import type { ApiProductResponse, ApiProductCategoryResponse, ApiIngredientResponse } from '../../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)
}

interface TreeNode {
  category: ApiProductCategoryResponse
  children: TreeNode[]
}

function buildTree(categories: ApiProductCategoryResponse[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const cat of categories) {
    nodeMap.set(cat.id, { category: cat, children: [] })
  }

  for (const cat of categories) {
    const node = nodeMap.get(cat.id)!
    if (cat.parent_id && nodeMap.has(cat.parent_id)) {
      nodeMap.get(cat.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function findPathInTree(tree: TreeNode[], targetId: string): TreeNode[] {
  for (const node of tree) {
    if (node.category.id === targetId) return [node]
    const sub = findPathInTree(node.children, targetId)
    if (sub.length > 0) return [node, ...sub]
  }
  return []
}

/** Set of leaf category IDs (categories without children) */
function getLeafIds(tree: TreeNode[]): Set<string> {
  const leaves = new Set<string>()
  function walk(nodes: TreeNode[]) {
    for (const n of nodes) {
      if (n.children.length === 0) {
        leaves.add(n.category.id)
      } else {
        walk(n.children)
      }
    }
  }
  walk(tree)
  return leaves
}

/** Total product count for a node (including all descendants) */
function totalProductCount(node: TreeNode): number {
  let count = node.category.product_count
  for (const child of node.children) {
    count += totalProductCount(child)
  }
  return count
}

// ─── Category Node ────────────────────────────────────────────────────

function CategoryNodeRow({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const isParent = node.children.length > 0
  const isExpanded = expanded.has(node.category.id)
  const isSelected = selectedId === node.category.id
  const count = isParent ? totalProductCount(node) : node.category.product_count

  return (
    <>
      <button
        type="button"
        onClick={() => (isParent ? onToggle(node.category.id) : onSelect(node.category.id))}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
          isSelected
            ? 'bg-orange-100 text-orange-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {isParent ? (
          isExpanded ? <ChevronDown size={16} className="shrink-0 text-gray-400" /> : <ChevronRight size={16} className="shrink-0 text-gray-400" />
        ) : (
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: node.category.color ?? '#6b7280' }}
          />
        )}
        {isParent ? (
          isExpanded ? <FolderOpen size={16} className="shrink-0 text-orange-400" /> : <Folder size={16} className="shrink-0 text-orange-400" />
        ) : null}
        <span className="truncate">{node.category.name}</span>
        {!node.category.is_active && (
          <Badge variant="neutral" size="sm">Inactiva</Badge>
        )}
        <span className="ml-auto text-xs text-gray-400 shrink-0">{count}</span>
      </button>
      {isParent && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryNodeRow
              key={child.category.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Product Form ─────────────────────────────────────────────────────

interface ProductForm {
  name: string
  description: string
  price: string
  category_id: string
  prep_time_min: string
  ingredient_ids: string[]
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  prep_time_min: '',
  ingredient_ids: [],
}

// ─── Main Component ───────────────────────────────────────────────────

export default function Products() {
  // ── Data ──────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<ApiProductCategoryResponse[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [allIngredients, setAllIngredients] = useState<ApiIngredientResponse[]>([])

  const [products, setProducts] = useState<ApiProductResponse[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // ── Pagination ────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // ── Tree navigation ───────────────────────────────────────────────
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // null = "Todos los productos"
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // ── CRUD modal ────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ApiProductResponse | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // ── Delete modal ──────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Derived state ─────────────────────────────────────────────────
  const tree = useMemo(() => buildTree(categories), [categories])

  const leafIds = useMemo(() => getLeafIds(tree), [tree])

  const selectedPath = useMemo(() => {
    if (!selectedCategoryId) return []
    return findPathInTree(tree, selectedCategoryId)
  }, [tree, selectedCategoryId])

  const filteredProducts = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  // ── Data loading ──────────────────────────────────────────────────

  const loadCategories = useCallback(async () => {
    try {
      const cats = await listProductCategoriesApi()
      setCategories(cats)
    } catch {
      // silent
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  const loadProducts = useCallback(async (categoryId: string | null, pageNum: number) => {
    setIsLoadingProducts(true)
    try {
      const result = await listProductsApi({
        ...(categoryId ? { category_id: categoryId } : {}),
        page: pageNum,
        per_page: 20,
      })
      setProducts(result.items)
      setTotalPages(result.meta.total_pages)
      setTotalProducts(result.meta.total)
    } catch {
      setProducts([])
      setTotalPages(1)
      setTotalProducts(0)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  const loadIngredients = useCallback(async () => {
    try {
      const result = await listIngredientsApi({ per_page: 100 })
      setAllIngredients(result.items)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    loadCategories()
    loadIngredients()
  }, [loadCategories, loadIngredients])

  // When selectedCategoryId changes, load products lazily
  useEffect(() => {
    loadProducts(selectedCategoryId, page)
  }, [selectedCategoryId, page, loadProducts])

  // ── Tree navigation handlers ──────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectCategory = useCallback((id: string) => {
    setSelectedCategoryId(id)
    setPage(1)
    setSearch('')
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedCategoryId(null)
    setPage(1)
    setSearch('')
  }, [])

  // ── CRUD handlers ─────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setEditingProduct(null)
    setForm({
      ...emptyForm,
      // Pre-select the currently viewed leaf category
      category_id: selectedCategoryId ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }, [selectedCategoryId])

  const openEdit = useCallback((product: ApiProductResponse) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      category_id: product.category_id,
      prep_time_min: product.prep_time_min ? String(product.prep_time_min) : '',
      ingredient_ids: product.ingredients?.map((i) => i.id) ?? [],
    })
    setFormError('')
    setModalOpen(true)
  }, [])

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
          ingredient_ids: form.ingredient_ids,
        })
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createProductApi({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: Number(form.price),
          category_id: form.category_id,
          prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : undefined,
          ingredient_ids: form.ingredient_ids,
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

  // ── Flat list of leaf categories for the product form selector ────
  const leafCategoryOptions = useMemo(() => {
    return categories
      .filter((c) => c.is_active && leafIds.has(c.id))
      .map((c) => ({ value: c.id, label: c.name }))
  }, [categories, leafIds])

  // ── Breadcrumb text ───────────────────────────────────────────────
  const breadcrumb = selectedPath.map((n) => n.category.name).join(' > ')

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-500 text-sm">Administrá los productos del menú</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          Nuevo producto
        </Button>
      </div>

      {isLoadingCategories ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Tree sidebar ──────────────────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0">
            <Card>
              <CardContent className="p-2">
                {/* "Todos los productos" */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-orange-100 text-orange-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package size={16} className="shrink-0" />
                  <span>Todos los productos</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {categories.reduce((sum, c) => sum + c.product_count, 0)}
                  </span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                {/* Tree */}
                <div className="max-h-[500px] overflow-y-auto space-y-0.5">
                  {tree.map((node) => (
                    <CategoryNodeRow
                      key={node.category.id}
                      node={node}
                      depth={0}
                      expanded={expanded}
                      selectedId={selectedCategoryId}
                      onToggle={handleToggle}
                      onSelect={handleSelectCategory}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Products panel ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb & search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                {breadcrumb ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="hover:text-gray-700 transition-colors"
                    >
                      Productos
                    </button>
                    {selectedPath.map((node) => (
                      <span key={node.category.id} className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className={node.category.id === selectedCategoryId ? 'text-gray-800 font-medium' : ''}>
                          {node.category.name}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Todos los productos</p>
                )}
              </div>
              <div className="w-full sm:w-56">
                <SearchInput
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Products table or empty state */}
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-orange-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Sin productos"
                description={
                  search
                    ? 'No hay productos con ese nombre'
                    : selectedCategoryId
                      ? 'Esta categoría no tiene productos'
                      : 'Todavía no hay productos creados'
                }
                action={
                  !search ? (
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
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Alérgenos</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-600">Prep. (min)</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
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
                            <td className="px-4 py-3">
                              {product.ingredients && product.ingredients.some((i) => i.is_allergen) ? (
                                <Badge variant="danger" size="sm" dot>
                                  {product.ingredients.filter((i) => i.is_allergen).length} alérgeno(s)
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">Sin alérgenos</span>
                              )}
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

            {!isLoadingProducts && totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                <p className="text-xs text-gray-400">{totalProducts} producto(s) — página {page} de {totalPages}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ────────────────────────────────────────── */}
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
                ...leafCategoryOptions,
              ]}
            />
            {leafCategoryOptions.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No hay categorías activas. Creá una categoría primero.
              </p>
            )}
          </div>

          {/* ── Ingredientes ──────────────────────────────────────────── */}
          {allIngredients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredientes
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {allIngredients.map((ing) => {
                  const checked = form.ingredient_ids.includes(ing.id)
                  return (
                    <label
                      key={ing.id}
                      className="flex items-center gap-3 cursor-pointer py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm({
                            ...form,
                            ingredient_ids: checked
                              ? form.ingredient_ids.filter((id) => id !== ing.id)
                              : [...form.ingredient_ids, ing.id],
                          })
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{ing.name}</span>
                      {ing.is_allergen && (
                        <Badge variant="danger" size="sm">Alérgeno</Badge>
                      )}
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Seleccioná los ingredientes que componen este producto
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
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

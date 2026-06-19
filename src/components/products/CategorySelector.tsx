// ─── Descripción ──────────────────────────────────────────────────────────────
// Selector de categorías con opción de crear nueva inline mediante modal.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/category.actions      → createCategoryAction, getCategoriesAction
// @/components/products/AddItemModal  → AddItemModal
// lucide-react                        → Plus
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { createCategoryAction, getCategoriesAction } from "@/app/actions/category.actions"
import { AddItemModal } from "@/components/products/AddItemModal"

type CategoryItem = { id: string; name: string }

type CategorySelectorProps = {
  value: string
  onChange: (categoryId: string, categoryName?: string) => void
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getCategoriesAction().then((r) => r.success && setCategories(r.data as CategoryItem[]))
  }, [])

  const handleCreate = async (name: string): Promise<boolean> => {
    const formData = new FormData()
    formData.set("name", name)
    const result = await createCategoryAction(formData)
    if (result.success && result.data) {
      const created = result.data as CategoryItem
      setCategories([...categories, created])
      onChange(created.id, created.name)
      return true
    }
    return false
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Categoría</label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => {
            const id = e.target.value
            const cat = categories.find((c) => c.id === id)
            onChange(id, cat?.name)
          }}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Plus className="h-3 w-3" />
        Crear nueva categoría
      </button>

      <AddItemModal
        isOpen={showModal}
        title="Nueva categoría"
        label="Nombre de la categoría"
        placeholder="Ej: Ropa, Accesorios..."
        onSave={handleCreate}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
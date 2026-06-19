"use client"

import { useState, useEffect } from "react"
import { X, Plus, Pencil, Trash2 } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { EditItemModal } from "@/components/products/EditItemModal"
import { ConfirmDeleteModal } from "@/components/products/ConfirmDeleteModal"
import {
  createCategoryAction,
  getCategoriesAction,
  deleteCategoryAction,
  renameCategoryAction,
} from "@/app/actions/category.actions"

type CategoryItem = { id: string; name: string }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null)

  const load = async () => {
    const r = await getCategoriesAction()
    if (r.success) setCategories(r.data as CategoryItem[])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    setError(null)
    const formData = new FormData()
    formData.set("name", trimmed)
    const r = await createCategoryAction(formData)
    if (r.success) {
      setName("")
      await load()
    } else {
      setError(r.error ?? "Error al crear la categoría.")
    }
    setIsSaving(false)
  }

  const handleRename = async (newName: string): Promise<boolean> => {
    if (!editingCategory) return false
    const formData = new FormData()
    formData.set("categoryId", editingCategory.id)
    formData.set("newName", newName)
    const r = await renameCategoryAction(formData)
    if (r.success) {
      await load()
      return true
    }
    throw new Error(r.error ?? "Error al renombrar la categoría.")
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    const r = await deleteCategoryAction(deletingCategory.id)
    if (!r.success) throw new Error(r.error ?? "Error al eliminar la categoría.")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/products" />
        <h1 className="text-2xl font-semibold tracking-tight">Gestionar Categorías</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nombre de la categoría"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            disabled={!name.trim() || isSaving}
            onClick={handleCreate}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {isSaving ? "Guardando..." : "Crear"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      <div className="rounded-xl border bg-card">
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No hay categorías registradas.</p>
        ) : (
          <ul className="divide-y">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(cat)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(cat)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditItemModal
        isOpen={!!editingCategory}
        title="Editar categoría"
        label="Nombre de la categoría"
        currentName={editingCategory?.name ?? ""}
        onSave={handleRename}
        onClose={() => setEditingCategory(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingCategory}
        itemName={deletingCategory?.name ?? ""}
        title="Eliminar categoría"
        onConfirm={handleDelete}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  )
}

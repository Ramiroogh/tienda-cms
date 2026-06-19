"use client"

import { useState, useEffect } from "react"
import { X, Plus, Pencil, Trash2 } from "lucide-react"
import { BackButton } from "@/components/ui/BackButton"
import { EditItemModal } from "@/components/products/EditItemModal"
import { ConfirmDeleteModal } from "@/components/products/ConfirmDeleteModal"
import { createTagAction, getTagsAction, deleteTagAction, renameTagAction } from "@/app/actions/tag.actions"

type TagItem = { id: string; name: string }

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [editingTag, setEditingTag] = useState<TagItem | null>(null)
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null)

  const load = async () => {
    const r = await getTagsAction()
    if (r.success) setTags(r.data as TagItem[])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    setError(null)
    const r = await createTagAction(trimmed)
    if (r.success) {
      setName("")
      await load()
    } else {
      setError(r.error ?? "Error al crear la etiqueta.")
    }
    setIsSaving(false)
  }

  const handleRename = async (newName: string): Promise<boolean> => {
    if (!editingTag) return false
    const r = await renameTagAction(editingTag.id, newName)
    if (r.success) {
      await load()
      return true
    }
    throw new Error(r.error ?? "Error al renombrar la etiqueta.")
  }

  const handleDelete = async () => {
    if (!deletingTag) return
    const r = await deleteTagAction(deletingTag.id)
    if (!r.success) throw new Error(r.error ?? "Error al eliminar la etiqueta.")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/products" />
        <h1 className="text-2xl font-semibold tracking-tight">Gestionar Etiquetas</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nombre de la etiqueta"
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
        {tags.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No hay etiquetas registradas.</p>
        ) : (
          <ul className="divide-y">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm">{tag.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingTag(tag)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTag(tag)}
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
        isOpen={!!editingTag}
        title="Editar etiqueta"
        label="Nombre de la etiqueta"
        currentName={editingTag?.name ?? ""}
        onSave={handleRename}
        onClose={() => setEditingTag(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingTag}
        itemName={deletingTag?.name ?? ""}
        title="Eliminar etiqueta"
        onConfirm={handleDelete}
        onClose={() => setDeletingTag(null)}
      />
    </div>
  )
}

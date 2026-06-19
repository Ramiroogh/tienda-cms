// ─── Descripción ──────────────────────────────────────────────────────────────
// Modal reutilizable para crear categorías, marcas y otros ítems inline.
// Se usa desde los selectores para crear nuevos valores sin recargar la página.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                        → X, Plus
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/CategorySelector.tsx
// components/products/BrandSelector.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect, useRef } from "react"
import { X, Plus } from "lucide-react"

type AddItemModalProps = {
  isOpen: boolean
  title: string
  label: string
  placeholder: string
  onSave: (name: string) => Promise<boolean>
  onClose: () => void
}

export function AddItemModal({ isOpen, title, label, placeholder, onSave, onClose }: AddItemModalProps) {
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName("")
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    setIsSaving(true)
    setError(null)

    try {
      const success = await onSave(trimmed)
      if (success) {
        onClose()
      } else {
        setError("No se pudo crear. Intentalo de nuevo.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{label}</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSave())}
            placeholder={placeholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!name.trim() || isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {isSaving ? "Guardando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  )
}
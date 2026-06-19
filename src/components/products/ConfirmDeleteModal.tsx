"use client"

import { useState, useEffect } from "react"
import { X, Loader2, AlertTriangle } from "lucide-react"

type ConfirmDeleteModalProps = {
  isOpen: boolean
  itemName: string
  title?: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDeleteModal({ isOpen, itemName, title, onConfirm, onClose }: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setIsDeleting(false)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar.")
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title ?? "Eliminar"}</h3>
          <button type="button" onClick={onClose} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de eliminar <strong>{itemName}</strong>?
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

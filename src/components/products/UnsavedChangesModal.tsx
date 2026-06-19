// ─── Descripción ──────────────────────────────────────────────────────────────
// Modal de confirmación al salir con cambios sin guardar.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                        → AlertTriangle
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { AlertTriangle } from "lucide-react"

type UnsavedChangesModalProps = {
  isOpen: boolean
  onSave: () => void
  onDiscard: () => void
  onClose: () => void
}

export function UnsavedChangesModal({ isOpen, onSave, onDiscard, onClose }: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium">Cambios sin guardar</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tenés cambios sin guardar. ¿Querés guardar un borrador antes de salir?
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Guardar borrador
          </button>
        </div>
      </div>
    </div>
  )
}
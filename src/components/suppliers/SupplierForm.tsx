// ─── Descripción ──────────────────────────────────────────────────────────────
// Formulario de creación de proveedor.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions      → createSupplierAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/suppliers/new/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useActionState } from "react"
import { createSupplierAction, ActionResult } from "@/app/actions/purchase.actions"

export function SupplierForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | undefined, formData: FormData) => createSupplierAction(formData),
    undefined,
  )

  return (
    <form action={formAction} className="supplier-form">
      {state?.error && (
        <p className="supplier-form__error">{state.error}</p>
      )}

      {state?.success && (
        <p className="supplier-form__success">Proveedor creado correctamente.</p>
      )}

      <label className="supplier-form__field">
        Nombre comercial *
        <input type="text" name="businessName" required className="supplier-form__input" />
      </label>

      <label className="supplier-form__field">
        Persona de contacto
        <input type="text" name="contactPerson" className="supplier-form__input" />
      </label>

      <label className="supplier-form__field">
        Teléfono
        <input type="tel" name="phone" className="supplier-form__input" />
      </label>

      <label className="supplier-form__field">
        Email
        <input type="email" name="email" className="supplier-form__input" />
      </label>

      <label className="supplier-form__field">
        Dirección
        <input type="text" name="address" className="supplier-form__input" />
      </label>

      <label className="supplier-form__field">
        Notas
        <textarea name="notes" className="supplier-form__textarea" />
      </label>

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Guardando..." : "Crear Proveedor"}
      </button>
    </form>
  )
}

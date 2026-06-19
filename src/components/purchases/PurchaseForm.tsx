// ─── Descripción ──────────────────────────────────────────────────────────────
// Formulario de creación de orden de compra (reposición).
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions      → registerRestockAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/purchases/new/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useActionState } from "react"
import { registerRestockAction, ActionResult } from "@/app/actions/purchase.actions"

export function PurchaseForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | undefined, formData: FormData) => registerRestockAction(formData),
    undefined,
  )

  return (
    <form action={formAction} className="purchase-form">
      {state?.error && (
        <p className="purchase-form__error">{state.error}</p>
      )}

      {state?.success && (
        <p className="purchase-form__success">Compra registrada correctamente.</p>
      )}

      <label className="purchase-form__field">
        Proveedor *
        <select name="supplierId" required className="purchase-form__select">
          <option value="">Seleccionar proveedor...</option>
        </select>
      </label>

      <label className="purchase-form__field">
        Fecha de compra *
        <input type="date" name="purchaseDate" required className="purchase-form__input" />
      </label>

      <label className="purchase-form__field">
        Nº Factura / Remito
        <input type="text" name="invoiceNumber" className="purchase-form__input" />
      </label>

      <label className="purchase-form__field">
        Notas
        <textarea name="notes" className="purchase-form__textarea" />
      </label>

      <input type="hidden" name="items" value="[]" />

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Guardando..." : "Registrar Compra"}
      </button>
    </form>
  )
}

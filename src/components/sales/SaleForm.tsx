// ─── Descripción ──────────────────────────────────────────────────────────────
// Formulario de registro de venta.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/sale.actions          → registerSaleAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/sales/new/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useActionState } from "react"
import { registerSaleAction, ActionResult } from "@/app/actions/sale.actions"

export function SaleForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | undefined, formData: FormData) => registerSaleAction(formData),
    undefined,
  )

  return (
    <form action={formAction} className="sale-form">
      {state?.error && (
        <p className="sale-form__error">{state.error}</p>
      )}

      {state?.success && (
        <p className="sale-form__success">Venta registrada correctamente.</p>
      )}

      <label className="sale-form__field">
        Canal de venta *
        <select name="saleChannel" required className="sale-form__select">
          <option value="">Seleccionar...</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>

      <label className="sale-form__field">
        Método de pago *
        <select name="paymentMethod" required className="sale-form__select">
          <option value="">Seleccionar...</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>

      <label className="sale-form__field">
        Descuento ($)
        <input type="number" name="discountAmount" defaultValue="0" min="0" className="sale-form__input" />
      </label>

      <label className="sale-form__field">
        Notas
        <textarea name="notes" className="sale-form__textarea" />
      </label>

      <input type="hidden" name="items" value="[]" />

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Registrando..." : "Registrar Venta"}
      </button>
    </form>
  )
}

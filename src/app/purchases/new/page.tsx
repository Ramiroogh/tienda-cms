// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de nueva orden de compra.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/ui/BackButton           → BackButton
// @/components/purchases/PurchaseForm  → PurchaseForm
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/purchases/page.tsx (link "Nueva orden")
// ──────────────────────────────────────────────────────────────────────────────

import { BackButton } from "@/components/ui/BackButton"
import { PurchaseForm } from "@/components/purchases/PurchaseForm"

export default function NewPurchasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/purchases" />
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Orden de Compra</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 md:p-8">
        <PurchaseForm />
      </div>
    </div>
  )
}

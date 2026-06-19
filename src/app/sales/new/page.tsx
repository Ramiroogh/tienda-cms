// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de registro de nueva venta.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/ui/BackButton          → BackButton
// @/components/sales/SaleForm         → SaleForm
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/sales/page.tsx (link "Registrar venta")
// ──────────────────────────────────────────────────────────────────────────────

import { BackButton } from "@/components/ui/BackButton"
import { SaleForm } from "@/components/sales/SaleForm"

export default function NewSalePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/sales" />
        <h1 className="text-2xl font-semibold tracking-tight">Registrar Venta</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 md:p-8">
        <SaleForm />
      </div>
    </div>
  )
}

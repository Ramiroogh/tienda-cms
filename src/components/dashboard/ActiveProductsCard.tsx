// ─── Descripción ──────────────────────────────────────────────────────────────
// Conteo de productos activos en el catálogo.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductsAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/dashboard/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getProductsAction } from "@/app/actions/product.actions"

export async function ActiveProductsCard() {
  const result = await getProductsAction({
    onlyActive: true
  })

  const activeProductCount = result.success && result.data
    ? (result.data as unknown[]).length
    : 0

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Productos Activos</h2>
        <span className="text-2xl font-semibold text-chart-3">#</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{activeProductCount}</p>
    </section>
  )
}
// ─── Descripción ──────────────────────────────────────────────────────────────
// Resumen de ventas del mes.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/sale.actions          → getSalesAction
// @/lib/utils/currency.utils          → formatPriceARS
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/dashboard/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getSalesAction } from "@/app/actions/sale.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"

export async function MonthlySalesCard() {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const result = await getSalesAction({
    dateFrom: firstDayOfMonth,
    dateTo: today
  })

  type SaleSummary = { sales: Array<{ saleTotal: number }> }

  const totalSales = result.success && result.data
    ? (result.data as SaleSummary).sales.reduce((sum, s) => sum + s.saleTotal, 0)
    : 0

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Ventas del Mes</h2>
        <span className="text-2xl font-semibold text-chart-2">$</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{formatPriceARS(totalSales)}</p>
    </section>
  )
}
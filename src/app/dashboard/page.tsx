// ─── Descripción ──────────────────────────────────────────────────────────────
// Dashboard principal. Muestra resumen de ventas, stock bajo y accesos rápidos.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/dashboard/SaleSummaryCard  → SaleSummaryCard
// @/components/dashboard/MonthlySalesCard  → MonthlySalesCard
// @/components/dashboard/ActiveProductsCard  → ActiveProductsCard
// @/components/dashboard/LowStockAlert    → LowStockAlert
// @/components/dashboard/QuickActions      → QuickActions
// @/components/products/ProductTable       → ProductTable
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { QuickActions } from "@/components/dashboard/QuickActions"
import { LowStockAlert } from "@/components/dashboard/LowStockAlert"
import { SaleSummaryCard } from "@/components/dashboard/SaleSummaryCard"
import { MonthlySalesCard } from "@/components/dashboard/MonthlySalesCard"
import { ActiveProductsCard } from "@/components/dashboard/ActiveProductsCard"
import { ProductTable } from "@/components/products/ProductTable"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Panel de Control</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SaleSummaryCard />
        <MonthlySalesCard />
        <ActiveProductsCard />
        <LowStockAlert />
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Productos Recientes</h2>
        <ProductTable />
      </section>

      <QuickActions />
    </div>
  )
}
// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de vista general de stock.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/stock/StockDashboard   → StockDashboard
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx (navegación)
// ──────────────────────────────────────────────────────────────────────────────

import { StockDashboard } from "@/components/stock/StockDashboard"

export default function StockPage() {
  return (
    <div className="stock-page">
      <h1 className="stock-page__title">Stock</h1>
      <StockDashboard />
    </div>
  )
}

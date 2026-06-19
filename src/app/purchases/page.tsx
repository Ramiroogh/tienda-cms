// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de órdenes de compra con tabla paginada, búsqueda y filtros.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/purchases/PurchasesTable  → PurchasesTable
// next/link                              → Link
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx (navegación)
// ──────────────────────────────────────────────────────────────────────────────

import Link from "next/link"
import { Plus } from "lucide-react"
import { PurchasesTable } from "@/components/purchases/PurchasesTable"

export default function PurchasesPage() {
  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>

        <div className="flex items-center gap-3">
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva orden
          </Link>
        </div>
      </div>

      {/* ── Purchases table ──────────────────────────────────────────────── */}
      <PurchasesTable />
    </div>
  )
}

// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de ventas con tabla paginada, búsqueda y filtros.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/sales/SalesTable       → SalesTable
// next/link                           → Link
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx (navegación)
// ──────────────────────────────────────────────────────────────────────────────

import Link from "next/link"
import { Plus } from "lucide-react"
import { SalesTable } from "@/components/sales/SalesTable"

export default function SalesPage() {
  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>

        <div className="flex items-center gap-3">
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Registrar venta
          </Link>
        </div>
      </div>

      {/* ── Sales table ──────────────────────────────────────────────────── */}
      <SalesTable />
    </div>
  )
}

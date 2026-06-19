// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de listado de proveedores con tabla paginada y búsqueda.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/suppliers/SuppliersTable  → SuppliersTable
// next/link                             → Link
// lucide-react                          → Plus
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx (navegación)
// ──────────────────────────────────────────────────────────────────────────────

import Link from "next/link"
import { Plus } from "lucide-react"
import { SuppliersTable } from "@/components/suppliers/SuppliersTable"

export default function SuppliersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>

        <Link
          href="/suppliers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </Link>
      </div>

      <SuppliersTable />
    </div>
  )
}
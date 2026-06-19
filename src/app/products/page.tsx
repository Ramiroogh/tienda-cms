// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de listado de productos con métricas, búsqueda y tabla paginada.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/products/ProductsTable  → ProductsTable
// @/components/products/MetricsWidget  → MetricsWidget
// next/link                           → Link
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx (navegación)
// ──────────────────────────────────────────────────────────────────────────────

import Link from "next/link"
import { Plus, Building2, FolderTree, Tag } from "lucide-react"
import { ProductsTable } from "@/components/products/ProductsTable"
import { MetricsWidget } from "@/components/products/MetricsWidget"
import { AttributeCard } from "@/components/products/AttributeCard"

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>

        <div className="flex items-center gap-3">
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* ── Metrics + Attribute cards ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 rounded-xl border bg-card px-6 py-4">
          <MetricsWidget />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <AttributeCard
            icon={Building2}
            label="Marcas"
            description="Administrar marcas"
            href="/products/brands"
          />
          <AttributeCard
            icon={FolderTree}
            label="Categorías"
            description="Administrar categorías"
            href="/products/categories"
          />
          <AttributeCard
            icon={Tag}
            label="Tags"
            description="Administrar etiquetas"
            href="/products/tags"
          />
        </div>
      </div>

      {/* ── Product table ─────────────────────────────────────────────────── */}
      <ProductsTable />
    </div>
  )
}
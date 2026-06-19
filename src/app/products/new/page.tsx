// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de creación de nuevo producto con formulario completo.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/products/ProductForm   → ProductForm
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/page.tsx (link "Nuevo producto")
// ──────────────────────────────────────────────────────────────────────────────

import { BackButton } from "@/components/ui/BackButton"
import { ProductForm } from "@/components/products/ProductForm"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/products" />
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Producto</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 md:p-8">
        <ProductForm />
      </div>
    </div>
  )
}
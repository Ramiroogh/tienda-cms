// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de creación de nuevo proveedor.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/suppliers/SupplierForm  → SupplierForm
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/suppliers/page.tsx (link "Nuevo proveedor")
// ──────────────────────────────────────────────────────────────────────────────

import { SupplierForm } from "@/components/suppliers/SupplierForm"

export default function NewSupplierPage() {
  return (
    <div className="new-supplier-page">
      <h1 className="new-supplier-page__title">Nuevo Proveedor</h1>
      <SupplierForm />
    </div>
  )
}

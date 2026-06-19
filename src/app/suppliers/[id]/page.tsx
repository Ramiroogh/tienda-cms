// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de detalle de proveedor. Muestra información, órdenes de compra
// y productos vinculados.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/suppliers/SupplierDetail  → SupplierDetail
// next/link                              → Link
// lucide-react                           → ChevronLeft
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/suppliers/page.tsx (link a detalle)
// ──────────────────────────────────────────────────────────────────────────────

import { BackButton } from "@/components/ui/BackButton"
import { SupplierDetail } from "@/components/suppliers/SupplierDetail"

type SupplierDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/suppliers" />
        <h1 className="text-2xl font-semibold tracking-tight">Detalle del Proveedor</h1>
      </div>

      <SupplierDetail supplierId={id} />
    </div>
  )
}
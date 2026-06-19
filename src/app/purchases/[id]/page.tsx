// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de detalle/recepción de orden de compra.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/ui/BackButton           → BackButton
// @/components/purchases/PurchaseDetail → PurchaseDetail
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/purchases/page.tsx (link a detalle)
// ──────────────────────────────────────────────────────────────────────────────

import { BackButton } from "@/components/ui/BackButton"
import { PurchaseDetail } from "@/components/purchases/PurchaseDetail"
import { DeleteOrderSection } from "@/components/purchases/DeleteOrderSection"

type PurchaseDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/purchases" />
        <h1 className="text-2xl font-semibold tracking-tight">Detalle de Orden de Compra</h1>
      </div>

      <PurchaseDetail purchaseOrderId={id} />

      <div className="flex justify-end border-t pt-6">
        <DeleteOrderSection purchaseOrderId={id} />
      </div>
    </div>
  )
}

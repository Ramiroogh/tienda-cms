// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de detalle de venta.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/ui/BackButton          → BackButton
// @/components/sales/SaleDetail       → SaleDetail
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/sales/page.tsx (link a detalle)
// ──────────────────────────────────────────────────────────────────────────────

import { BackButton } from "@/components/ui/BackButton"
import { SaleDetail } from "@/components/sales/SaleDetail"

type SaleDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/sales" />
        <h1 className="text-2xl font-semibold tracking-tight">Detalle de Venta</h1>
      </div>

      <SaleDetail saleId={id} />
    </div>
  )
}

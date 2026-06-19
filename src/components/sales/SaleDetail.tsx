// ─── Descripción ──────────────────────────────────────────────────────────────
// Detalle completo de una venta con sus ítems.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/sale.actions          → getSaleByIdAction
// @/lib/utils/currency.utils          → formatPriceARS
// @/lib/utils/date.utils              → formatDateTime
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/sales/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getSaleByIdAction } from "@/app/actions/sale.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"
import { formatDateTime } from "@/lib/utils/date.utils"

type SaleDetailProps = {
  saleId: string
}

export async function SaleDetail({ saleId }: SaleDetailProps) {
  const result = await getSaleByIdAction(saleId)

  if (!result.success) {
    return <p className="sale-detail__error">{result.error}</p>
  }

  type SaleDetailData = {
    id: string; saleDate: Date; saleChannel: string; paymentMethod: string; saleTotal: number; notes: string | null
    items: Array<{
      id: string; soldQuantity: number; unitPrice: number
      product: { name: string }
      variant: { size: string | null; color: string | null } | null
    }>
  }
  const sale = result.data as SaleDetailData

  return (
    <div className="sale-detail">
      <h1 className="sale-detail__title">Venta #{sale.id.slice(0, 8)}</h1>

      <div className="sale-detail__info">
        <p><strong>Fecha:</strong> {formatDateTime(sale.saleDate)}</p>
        <p><strong>Canal:</strong> {sale.saleChannel}</p>
        <p><strong>Pago:</strong> {sale.paymentMethod}</p>
        {sale.notes && <p><strong>Notas:</strong> {sale.notes}</p>}
      </div>

      <section className="sale-detail__items">
        <h2>Productos</h2>
        <table className="sale-detail__table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Variante</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>
                  {[item.variant?.size, item.variant?.color]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
                <td>{item.soldQuantity}</td>
                <td>{formatPriceARS(item.unitPrice)}</td>
                <td>{formatPriceARS(item.unitPrice * item.soldQuantity)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={4}><strong>Total</strong></td>
              <td><strong>{formatPriceARS(sale.saleTotal)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  )
}

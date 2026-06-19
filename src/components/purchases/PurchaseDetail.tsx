// ─── Descripción ──────────────────────────────────────────────────────────────
// Detalle de orden de compra con opción de recepción.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions      → getPurchaseOrderByIdAction
// @/lib/utils/date.utils              → formatDateTime
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/purchases/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getPurchaseOrderByIdAction } from "@/app/actions/purchase.actions"
import { formatDateTime } from "@/lib/utils/date.utils"

type PurchaseDetailProps = {
  purchaseOrderId: string
}

export async function PurchaseDetail({ purchaseOrderId }: PurchaseDetailProps) {
  const result = await getPurchaseOrderByIdAction(purchaseOrderId)

  if (!result.success) {
    return <p className="purchase-detail__error">{result.error}</p>
  }

  type PurchaseOrderData = {
    id: string; purchaseDate: Date; invoiceNumber: string | null; orderStatus: string; totalOrderCost: number | null;
    supplier: { businessName: string };
    items: Array<{ id: string; product: { name: string }; variant: { size: string | null; color: string | null } | null; orderedQuantity: number; unitCost: number }>
  }
  const order = result.data as PurchaseOrderData

  return (
    <div className="purchase-detail">
      <h1 className="purchase-detail__title">
        Orden #{order.id.slice(0, 8)}
      </h1>

      <div className="purchase-detail__info">
        <p><strong>Proveedor:</strong> {order.supplier.businessName}</p>
        <p><strong>Fecha:</strong> {formatDateTime(order.purchaseDate)}</p>
        <p><strong>Estado:</strong> {order.orderStatus}</p>
        <p><strong>Factura:</strong> {order.invoiceNumber ?? "—"}</p>
        {order.totalOrderCost && (
          <p><strong>Costo total:</strong> ${order.totalOrderCost}</p>
        )}
      </div>

      <section className="purchase-detail__items">
        <h2>Productos</h2>
        <table className="purchase-detail__table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Variante</th>
              <th>Cantidad</th>
              <th>Costo unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>
                  {[item.variant?.size, item.variant?.color]
                    .filter(Boolean)
                    .join(" /") || "—"}
                </td>
                <td>{item.orderedQuantity}</td>
                <td>${item.unitCost}</td>
                <td>${item.unitCost * item.orderedQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

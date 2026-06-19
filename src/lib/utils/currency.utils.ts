// ─── Descripción ──────────────────────────────────────────────────────────────
// Utilidades de formato monetario.
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/sales/SaleItemRow.tsx
// components/sales/SaleSummaryCard.tsx
// ──────────────────────────────────────────────────────────────────────────────

export function formatPriceARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculateSubtotal(
  items: Array<{ unitPrice: number; soldQuantity: number }>,
): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.soldQuantity, 0)
}

export function calculateSaleTotal(
  subtotal: number,
  discountAmount: number,
): number {
  return Math.max(0, subtotal - discountAmount)
}

export function calculateOrderTotal(
  items: Array<{ unitCost: number; orderedQuantity: number }>,
): number {
  return items.reduce((sum, item) => sum + item.unitCost * item.orderedQuantity, 0)
}

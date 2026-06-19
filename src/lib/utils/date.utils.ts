// ─── Descripción ──────────────────────────────────────────────────────────────
// Utilidades de formato de fechas.
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/sales/SaleHistory.tsx
// components/purchases/PurchaseList.tsx
// ──────────────────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

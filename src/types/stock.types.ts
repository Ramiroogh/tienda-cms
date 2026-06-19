// ─── Descripción ──────────────────────────────────────────────────────────────
// Tipos del módulo de stock. Movimientos y estados de disponibilidad.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @prisma/client                     → StockMovement, StockMovementReason
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/stock.service.ts
// lib/repositories/stock.repository.ts
// ──────────────────────────────────────────────────────────────────────────────

import type { StockMovement } from "@/generated/prisma/client"

export type StockMovementWithRelations = StockMovement & {
  relatedSale: { id: string; saleDate: Date } | null
  relatedPurchase: { id: string; invoiceNumber: string | null } | null
}

export type StockAdjustmentPayload = {
  variantId: string
  newStockLevel: number
  notes: string
}

export type StockMovementHistoryResult = {
  movements: StockMovementWithRelations[]
  totalCount: number
}

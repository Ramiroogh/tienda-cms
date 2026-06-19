// ─── Descripción ──────────────────────────────────────────────────────────────
// Tipos del módulo de ventas. Payloads, resultados y shapes extendidos de Prisma.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @prisma/client                     → Sale, SaleItem, SaleChannel, PaymentMethod
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/sale.service.ts
// lib/repositories/sale.repository.ts
// lib/validators/sale.schema.ts
// ──────────────────────────────────────────────────────────────────────────────

import type { Sale, SaleItem, SaleChannel, PaymentMethod } from "@/generated/prisma/client"

export type SaleWithItems = Sale & {
  items: Array<SaleItem & { product: { name: string }; variant: { size: string | null; color: string | null } | null }>
}

export type CreateSalePayload = {
  saleDate?: Date
  saleChannel: SaleChannel
  paymentMethod: PaymentMethod
  discountAmount?: number
  notes?: string
  items: Array<{
    productId: string
    variantId: string
    productName: string
    soldQuantity: number
    unitPrice: number
  }>
}

export type SaleCreatedResult = {
  sale: SaleWithItems
}

export type SaleFilters = {
  dateFrom?: Date
  dateTo?: Date
  saleChannel?: SaleChannel
  paymentMethod?: PaymentMethod
}

export type PaginatedSaleResult = {
  sales: SaleWithItems[]
  total: number
  page: number
  pageSize: number
}

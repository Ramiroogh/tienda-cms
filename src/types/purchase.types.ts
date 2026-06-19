// ─── Descripción ──────────────────────────────────────────────────────────────
// Tipos del módulo de compras de mercadería y proveedores.
// Payloads, resultados y shapes extendidos de Prisma.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @prisma/client                     → PurchaseOrder, PurchaseOrderItem,
//                                      PurchaseOrderStatus, Supplier
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/purchase.service.ts
// lib/repositories/purchase.repository.ts
// ──────────────────────────────────────────────────────────────────────────────

import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
} from "@/generated/prisma/client"

export type PurchaseOrderWithItems = PurchaseOrder & {
  items: Array<
    PurchaseOrderItem & {
      product: { name: string }
      variant: { size: string | null; color: string | null } | null
    }
  >
  supplier: Supplier
}

export type RegisterPurchaseNewProductPayload = {
  productName: string
  categoryId?: string
  brand?: string
  tags?: string[]
  referenceLinks?: string[]
  costPrice?: number
  salePrice: number
  variants: Array<{ size?: string; color?: string }>
  supplierId: string
  purchaseDate: Date
  invoiceNumber?: string
  notes?: string
  purchasedItems: Array<{
    variantIndex: number
    orderedQuantity: number
    unitCost: number
  }>
}

export type RegisterRestockPayload = {
  supplierId: string
  purchaseDate: Date
  invoiceNumber?: string
  notes?: string
  items: Array<{
    productId: string
    variantId: string
    orderedQuantity: number
    unitCost: number
  }>
}

export type SupplierWithOrders = Supplier & {
  purchaseOrders: PurchaseOrder[]
}

export type SupplierFilters = {
  searchTerm?: string
  onlyActive?: boolean
}

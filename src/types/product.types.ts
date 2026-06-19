// ─── Descripción ──────────────────────────────────────────────────────────────
// Tipos del módulo de productos. Payloads, resultados y shapes extendidos de Prisma.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @prisma/client                     → Product, ProductVariant, ProductStatus
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/product.service.ts
// lib/repositories/product.repository.ts
// lib/services/purchase.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import type { Product, ProductVariant } from "@/generated/prisma/client"
import type { StockMovementWithRelations } from "./stock.types"

export type ProductWithVariants = Product & {
  variants: ProductVariant[]
}

export type ProductWithFullDetail = ProductWithVariants & {
  category: import("@/generated/prisma/client").Category | null
  saleItems: import("@/generated/prisma/client").SaleItem[]
  purchaseItems: import("@/generated/prisma/client").PurchaseOrderItem[]
  variants: Array<ProductVariant & { stockMovements: StockMovementWithRelations[] }>
}

export type CreateProductDraftPayload = {
  name: string
  description?: string
  sku?: string
  categoryId?: string
  brand?: string
  tags?: string[]
  referenceLinks?: string[]
  costPrice?: number
  salePrice: number
  stock?: number
  variants: Array<{
    size?: string | null
    color?: string | null
    stockLevel?: number
    price?: number | null
  }>
}

export type UpdateProductPayload = {
  name?: string
  description?: string
  sku?: string
  categoryId?: string | null
  brand?: string
  tags?: string[]
  referenceLinks?: string[]
  costPrice?: number | null
  salePrice?: number
}

export type ProductFilters = {
  searchTerm?: string
  categoryId?: string
  supplierId?: string
  productStatus?: import("@/generated/prisma/client").ProductStatus
  onlyActive?: boolean
  lowStock?: boolean
}

export const STOCK_AVAILABILITY = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const

export type StockAvailabilityStatus =
  (typeof STOCK_AVAILABILITY)[keyof typeof STOCK_AVAILABILITY]

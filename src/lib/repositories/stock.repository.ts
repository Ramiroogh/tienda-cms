// ─── Descripción ──────────────────────────────────────────────────────────────
// Capa de acceso a datos del módulo de stock.
// Único punto de contacto con Prisma para StockMovement y actualización de stock.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/types/stock.types                → StockMovementWithRelations
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/stock.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import type { StockMovementWithRelations } from "@/types/stock.types"
import type { Prisma } from "@/generated/prisma/client"

export const stockRepository = {

  // ── createMovement ───────────────────────────────────────────────────────────

  createMovement: async (
    tx: Prisma.TransactionClient,
    data: {
      variantId: string
      movementReason: string
      quantityDelta: number
      stockLevelBefore: number
      stockLevelAfter: number
      relatedSaleId?: string
      relatedPurchaseId?: string
      notes?: string
    },
  ): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await tx.stockMovement.create({ data: data as any })
  },


  // ── getMovementHistory ───────────────────────────────────────────────────────

  getMovementHistory: async (
    variantId: string,
  ): Promise<StockMovementWithRelations[]> => {
    return prisma.stockMovement.findMany({
      where: { variantId },
      include: {
        relatedSale: { select: { id: true, saleDate: true } },
        relatedPurchase: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  },


  // ── updateVariantStock ───────────────────────────────────────────────────────

  updateVariantStock: async (
    tx: Prisma.TransactionClient,
    variantId: string,
    data: {
      stockLevel: number
      soldCount?: number
    },
  ): Promise<{ stockLevel: number; soldCount: number }> => {
    return tx.productVariant.update({
      where: { id: variantId },
      data,
      select: { stockLevel: true, soldCount: true },
    })
  },


  // ── getVariantStockLevel ─────────────────────────────────────────────────────

  getVariantStockLevel: async (variantId: string): Promise<number | null> => {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stockLevel: true },
    })
    return variant?.stockLevel ?? null
  },

}

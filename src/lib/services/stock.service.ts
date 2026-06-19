// ─── Descripción ──────────────────────────────────────────────────────────────
// Servicio de stock. Único punto que modifica stockLevel y soldCount.
// Cada modificación crea un StockMovement (auditoría append-only).
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/lib/repositories/stock.repository → stockRepository
// @/lib/errors/domain.errors         → VariantNotFoundError,
//                                        ManualAdjustmentNoteRequiredError
// @/lib/constants                    → MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH
// @/types/stock.types                → StockMovementWithRelations,
//                                        StockAdjustmentPayload
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/sale.service.ts
// lib/services/purchase.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import { stockRepository } from "@/lib/repositories/stock.repository"
import {
  VariantNotFoundError,
  ManualAdjustmentNoteRequiredError,
} from "@/lib/errors/domain.errors"
import { MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH } from "@/lib/constants"
import type { StockMovementWithRelations, StockAdjustmentPayload } from "@/types/stock.types"
import type { Prisma } from "@/generated/prisma/client"

export const stockService = {

  // ── increaseStock ────────────────────────────────────────────────────────────
  // Entrada de stock: compras de mercadería, ajustes manuales positivos.
  // Acepta un tx opcional para participar en una transacción externa.

  increaseStock: async (
    variantId: string,
    quantity: number,
    reason: "PURCHASE" | "MANUAL_ADJUSTMENT" | "INITIAL",
    relatedPurchaseId?: string,
    notes?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> => {
    const execute = async (client: Prisma.TransactionClient) => {
      const variant = await client.productVariant.findUnique({
        where: { id: variantId },
        select: { stockLevel: true, soldCount: true },
      })

      if (!variant) {
        throw new VariantNotFoundError(variantId)
      }

      const stockLevelBefore = variant.stockLevel
      const stockLevelAfter = stockLevelBefore + quantity

      await stockRepository.updateVariantStock(client, variantId, {
        stockLevel: stockLevelAfter,
      })

      await stockRepository.createMovement(client, {
        variantId,
        movementReason: reason,
        quantityDelta: quantity,
        stockLevelBefore,
        stockLevelAfter,
        relatedPurchaseId,
        notes,
      })
    }

    if (tx) return execute(tx)
    await prisma.$transaction(execute)
  },


  // ── decreaseStock ────────────────────────────────────────────────────────────
  // Salida de stock: ventas, ajustes manuales negativos.
  // Acepta un tx opcional para participar en una transacción externa.

  decreaseStock: async (
    variantId: string,
    quantity: number,
    reason: "SALE" | "MANUAL_ADJUSTMENT",
    relatedSaleId?: string,
    notes?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> => {
    const execute = async (client: Prisma.TransactionClient) => {
      const variant = await client.productVariant.findUnique({
        where: { id: variantId },
        select: { stockLevel: true, soldCount: true },
      })

      if (!variant) {
        throw new VariantNotFoundError(variantId)
      }

      const stockLevelBefore = variant.stockLevel
      const stockLevelAfter = stockLevelBefore - quantity

      await stockRepository.updateVariantStock(client, variantId, {
        stockLevel: stockLevelAfter,
        soldCount: variant.soldCount + quantity,
      })

      await stockRepository.createMovement(client, {
        variantId,
        movementReason: reason,
        quantityDelta: -quantity,
        stockLevelBefore,
        stockLevelAfter,
        relatedSaleId,
        notes,
      })
    }

    if (tx) return execute(tx)
    await prisma.$transaction(execute)
  },


  // ── adjustStockManually ──────────────────────────────────────────────────────
  // Ajuste manual: setea un nuevo stockLevel y registra movimiento.

  adjustStockManually: async (
    payload: StockAdjustmentPayload,
  ): Promise<void> => {
    if (!payload.notes || payload.notes.length < MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH) {
      throw new ManualAdjustmentNoteRequiredError()
    }

    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: payload.variantId },
        select: { stockLevel: true, soldCount: true },
      })

      if (!variant) {
        throw new VariantNotFoundError(payload.variantId)
      }

      const stockLevelBefore = variant.stockLevel
      const quantityDelta = payload.newStockLevel - stockLevelBefore

      await stockRepository.updateVariantStock(tx, payload.variantId, {
        stockLevel: payload.newStockLevel,
      })

      await stockRepository.createMovement(tx, {
        variantId: payload.variantId,
        movementReason: "MANUAL_ADJUSTMENT",
        quantityDelta,
        stockLevelBefore,
        stockLevelAfter: payload.newStockLevel,
        notes: payload.notes,
      })
    })
  },


  // ── getMovementHistory ───────────────────────────────────────────────────────

  getMovementHistory: async (
    variantId: string,
  ): Promise<StockMovementWithRelations[]> => {
    return stockRepository.getMovementHistory(variantId)
  },


  // ── getVariantStockLevel ─────────────────────────────────────────────────────

  getVariantStockLevel: async (variantId: string): Promise<number | null> => {
    return stockRepository.getVariantStockLevel(variantId)
  },

}

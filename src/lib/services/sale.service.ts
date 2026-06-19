// ─── Descripción ──────────────────────────────────────────────────────────────
// Servicio de ventas. Orquesta la salida de mercadería.
// Registra Sale + SaleItems + descuenta stock en una transacción atómica.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/lib/repositories/sale.repository  → saleRepository
// @/lib/services/stock.service       → stockService
// @/lib/errors/domain.errors         → InsufficientStockError,
//                                       ProductNotActiveError,
//                                       SaleNotFoundError
// @/types/sale.types                 → CreateSalePayload, SaleCreatedResult,
//                                       SaleWithItems, SaleFilters,
//                                       PaginatedSaleResult
// @/lib/constants                    → DEFAULT_PAGE_SIZE
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/sale.actions.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import { saleRepository } from "@/lib/repositories/sale.repository"
import { stockService } from "@/lib/services/stock.service"
import {
  InsufficientStockError,
  ProductNotActiveError,
  SaleNotFoundError,
} from "@/lib/errors/domain.errors"
import type {
  CreateSalePayload,
  SaleCreatedResult,
  SaleWithItems,
  SaleFilters,
  PaginatedSaleResult,
} from "@/types/sale.types"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"

export const saleService = {

  // ── registerSale ────────────────────────────────────────────────────────────
  // Flujo completo:
  //   1. Valida stock disponible para cada ítem
  //   2. Valida que los productos estén activos
  //   3. Calcula total (subtotal - descuento)
  //   4. Crea Sale + SaleItems + descuenta stock en transacción atómica

  registerSale: async (payload: CreateSalePayload): Promise<SaleCreatedResult> => {
    const saleDate = payload.saleDate ?? new Date()
    const discountAmount = payload.discountAmount ?? 0

    // ── Validaciones previas ──────────────────────────────────────────────────

    for (const item of payload.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { select: { productStatus: true, isActive: true } } },
      })

      if (!variant) {
        throw new ProductNotActiveError(item.productId)
      }

      if (variant.product.productStatus !== "ACTIVE" || !variant.product.isActive) {
        throw new ProductNotActiveError(item.productId)
      }

      if (variant.stockLevel < item.soldQuantity) {
        throw new InsufficientStockError(
          item.productName,
          variant.stockLevel,
          item.soldQuantity,
        )
      }
    }

    // ── Cálculo de totales ────────────────────────────────────────────────────

    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.unitPrice * item.soldQuantity,
      0,
    )
    const saleTotal = subtotal - discountAmount

    // ── Transacción atómica ────────────────────────────────────────────────────

    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await saleRepository.create(tx, {
        saleDate,
        saleChannel: payload.saleChannel,
        paymentMethod: payload.paymentMethod,
        discountAmount,
        saleTotal,
        notes: payload.notes,
        items: payload.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          soldQuantity: item.soldQuantity,
          unitPrice: item.unitPrice,
        })),
      })

      for (const item of payload.items) {
        await stockService.decreaseStock(
          item.variantId,
          item.soldQuantity,
          "SALE",
          createdSale.id,
          undefined,
          tx,
        )
      }

      return createdSale
    })

    return { sale }
  },


  // ── getSaleHistory ───────────────────────────────────────────────────────────

  getSaleHistory: async (
    filters: SaleFilters = {},
  ): Promise<PaginatedSaleResult> => {
    const sales = await saleRepository.findAll(filters)
    const total = await saleRepository.countByFilters(filters)

    return {
      sales,
      total,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    }
  },


  // ── getSaleById ──────────────────────────────────────────────────────────────

  getSaleById: async (saleId: string): Promise<SaleWithItems> => {
    const sale = await saleRepository.findById(saleId)

    if (!sale) {
      throw new SaleNotFoundError(saleId)
    }

    return sale
  },

}

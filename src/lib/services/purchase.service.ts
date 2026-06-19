// ─── Descripción ──────────────────────────────────────────────────────────────
// Servicio de compras de mercadería. Orquesta la entrada de stock.
// Soporta dos flujos:
//   PATH A: Producto nuevo (crea Product DRAFT + Variants + PurchaseOrder)
//   PATH B: Reposición (crea PurchaseOrder + actualiza stock)
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/lib/repositories/purchase.repository → purchaseRepository
// @/lib/repositories/product.repository  → productRepository
// @/lib/services/stock.service       → stockService
// @/lib/services/product.service     → productService
// @/lib/errors/domain.errors         → SupplierInactiveError,
//                                       PurchaseOrderNotFoundError,
//                                       ProductNotFoundError
// @/types/purchase.types             → RegisterPurchaseNewProductPayload,
//                                       RegisterRestockPayload,
//                                       PurchaseOrderWithItems
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/purchase.actions.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import { purchaseRepository } from "@/lib/repositories/purchase.repository"
import { productRepository } from "@/lib/repositories/product.repository"
import { stockService } from "@/lib/services/stock.service"
import {
  SupplierInactiveError,
  PurchaseOrderNotFoundError,
  ProductNotFoundError,
} from "@/lib/errors/domain.errors"
import type {
  RegisterPurchaseNewProductPayload,
  RegisterRestockPayload,
  PurchaseOrderWithItems,
} from "@/types/purchase.types"
import type { Prisma } from "@/generated/prisma/client"

export const purchaseService = {

  // ── registerPurchaseWithNewProduct ─────────────────────────────────────────
  // PATH A: mercadería de producto nuevo
  //   → Crea Product (DRAFT) + Variants + PurchaseOrder
  //   → Llama a stockService.increaseStock

  registerPurchaseWithNewProduct: async (
    payload: RegisterPurchaseNewProductPayload,
  ): Promise<void> => {
    if (payload.supplierId) {
      const supplier = await purchaseRepository.findSupplierById(payload.supplierId)

      if (!supplier || !supplier.isActive) {
        throw new SupplierInactiveError(payload.supplierId)
      }
    }

    await prisma.$transaction(async (tx) => {
      const product = await productRepository.create(tx, {
        name: payload.productName,
        categoryId: payload.categoryId,
        brand: payload.brand,
        tags: payload.tags ?? [],
        referenceLinks: payload.referenceLinks ?? [],
        costPrice: payload.costPrice,
        salePrice: payload.salePrice,
        productStatus: "DRAFT",
      })

      const createdVariants = await Promise.all(
        payload.variants.map((v) =>
          productRepository.createVariant(tx, {
            productId: product.id,
            size: v.size,
            color: v.color,
          }),
        ),
      )

      const order = await purchaseRepository.createOrder(tx, {
        supplierId: payload.supplierId,
        purchaseDate: payload.purchaseDate,
        invoiceNumber: payload.invoiceNumber,
        notes: payload.notes,
      })

      let totalCost = 0

      for (const pi of payload.purchasedItems) {
        const variant = createdVariants[pi.variantIndex]

        await purchaseRepository.createOrderItem(tx, {
          purchaseOrderId: order.id,
          productId: product.id,
          variantId: variant.id,
          orderedQuantity: pi.orderedQuantity,
          unitCost: pi.unitCost,
        })

        await stockService.increaseStock(
          variant.id,
          pi.orderedQuantity,
          "PURCHASE",
          order.id,
          undefined,
          tx,
        )

        totalCost += pi.orderedQuantity * pi.unitCost
      }

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { totalOrderCost: totalCost },
      })
    })
  },


  // ── registerPurchaseRestock ─────────────────────────────────────────────────
  // PATH B: reposición de producto existente
  //   → Crea PurchaseOrder + PurchaseOrderItems
  //   → Llama a stockService.increaseStock

  registerPurchaseRestock: async (
    payload: RegisterRestockPayload,
  ): Promise<void> => {
    if (payload.supplierId) {
      const supplier = await purchaseRepository.findSupplierById(payload.supplierId)

      if (!supplier || !supplier.isActive) {
        throw new SupplierInactiveError(payload.supplierId)
      }
    }

    await prisma.$transaction(async (tx) => {
      const order = await purchaseRepository.createOrder(tx, {
        supplierId: payload.supplierId,
        purchaseDate: payload.purchaseDate,
        invoiceNumber: payload.invoiceNumber,
        notes: payload.notes,
      })

      let totalCost = 0

      for (const item of payload.items) {
        const product = await productRepository.findById(item.productId)

        if (!product) {
          throw new ProductNotFoundError(item.productId)
        }

        await purchaseRepository.createOrderItem(tx, {
          purchaseOrderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          orderedQuantity: item.orderedQuantity,
          unitCost: item.unitCost,
        })

        await stockService.increaseStock(
          item.variantId,
          item.orderedQuantity,
          "PURCHASE",
          order.id,
          undefined,
          tx,
        )

        totalCost += item.orderedQuantity * item.unitCost
      }

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { totalOrderCost: totalCost },
      })
    })
  },


  // ── registerPurchaseOrder ────────────────────────────────────────────────────
  // Nuevo flujo: selecciona productos sin purchaseOrderId,
  // crea la orden y marca los productos con purchaseOrderId.

  registerPurchaseOrder: async (payload: {
    supplierId?: string
    purchaseDate?: Date
    invoiceNumber?: string
    shippingCost?: number
    notes?: string
    productIds: string[]
  }): Promise<void> => {
    if (payload.supplierId) {
      const supplier = await purchaseRepository.findSupplierById(payload.supplierId)

      if (!supplier || !supplier.isActive) {
        throw new SupplierInactiveError(payload.supplierId)
      }
    }

    await prisma.$transaction(async (tx) => {
      const order = await purchaseRepository.createOrder(tx, {
        supplierId: payload.supplierId,
        purchaseDate: payload.purchaseDate ?? new Date(),
        notes: payload.notes,
      })

      let orderTotalCost = 0

      for (const productId of payload.productIds) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        })

        if (!product) {
          throw new ProductNotFoundError(productId)
        }

        if (product.purchaseOrderId) {
          throw new Error(`El producto "${product.name}" ya tiene una orden de compra asignada.`)
        }

        for (const variant of product.variants) {
          await purchaseRepository.createOrderItem(tx, {
            purchaseOrderId: order.id,
            productId: product.id,
            variantId: variant.id,
            orderedQuantity: variant.stockLevel,
            unitCost: product.costPrice ?? 0,
          })

          orderTotalCost += (product.costPrice ?? 0) * variant.stockLevel
        }

        await tx.product.update({
          where: { id: product.id },
          data: { purchaseOrderId: order.id },
        })
      }

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { totalOrderCost: orderTotalCost + (payload.shippingCost ?? 0) },
      })
    })
  },


  // ── deletePurchaseOrder ────────────────────────────────────────────────────
  // Desarma la orden: libera los productos para ser usados en otra orden
  // y elimina el registro de la orden de compra.

  deletePurchaseOrder: async (orderId: string): Promise<void> => {
    const order = await purchaseRepository.findOrderById(orderId)

    if (!order) {
      throw new PurchaseOrderNotFoundError(orderId)
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { purchaseOrderId: null },
        })
      }

      await purchaseRepository.deleteOrder(tx, orderId)
    })
  },


  // ── getPurchaseOrders ────────────────────────────────────────────────────────

  getPurchaseOrders: async (): Promise<PurchaseOrderWithItems[]> => {
    return purchaseRepository.findAllOrders()
  },


  // ── getPurchaseOrderById ─────────────────────────────────────────────────────

  getPurchaseOrderById: async (
    orderId: string,
  ): Promise<PurchaseOrderWithItems> => {
    const order = await purchaseRepository.findOrderById(orderId)

    if (!order) {
      throw new PurchaseOrderNotFoundError(orderId)
    }

    return order
  },

}

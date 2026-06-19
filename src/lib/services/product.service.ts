// ─── Descripción ──────────────────────────────────────────────────────────────
// Servicio de productos. Orquesta el ciclo de vida: DRAFT → ACTIVE → INACTIVE.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/lib/repositories/product.repository → productRepository
// @/lib/services/stock.service       → stockService
// @/lib/errors/domain.errors         → ProductNotFoundError
// @/types/product.types              → ProductWithVariants,
//                                       CreateProductDraftPayload,
//                                       UpdateProductPayload, ProductFilters
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/purchase.service.ts
// app/actions/product.actions.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import { productRepository } from "@/lib/repositories/product.repository"
import { stockService } from "@/lib/services/stock.service"
import { ProductNotFoundError } from "@/lib/errors/domain.errors"
import type {
  ProductWithVariants,
  CreateProductDraftPayload,
  UpdateProductPayload,
  ProductFilters,
  StockAvailabilityStatus,
} from "@/types/product.types"
import { STOCK_AVAILABILITY } from "@/types/product.types"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"

export const productService = {

  // ── createProductDraft ───────────────────────────────────────────────────────
  // Crea un producto en estado DRAFT con sus variantes.
  // Cada variante arranca con stockLevel 0 y un StockMovement INITIAL.

  createProductDraft: async (payload: CreateProductDraftPayload) => {
    const { variants, ...productData } = payload

    return prisma.$transaction(async (tx) => {
      const product = await productRepository.create(tx, {
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        categoryId: productData.categoryId,
        brand: productData.brand,
        tags: productData.tags ?? [],
        referenceLinks: productData.referenceLinks ?? [],
        costPrice: productData.costPrice,
        salePrice: productData.salePrice,
        productStatus: "ACTIVE",
      })

      const productStock = payload.stock ?? 0
      const createdVariants = await Promise.all(
        variants.map((v) =>
          productRepository.createVariant(tx, {
            productId: product.id,
            size: v.size,
            color: v.color,
            stockLevel: 0,
            price: v.price,
          }),
        ),
      )

      for (let i = 0; i < createdVariants.length; i++) {
        const isSimple = variants.length === 1 && !variants[0].size && !variants[0].color
        const quantity = isSimple ? productStock : (variants[i].stockLevel ?? 0)
        await stockService.increaseStock(
          createdVariants[i].id,
          quantity,
          "INITIAL",
          undefined,
          "Stock inicial al crear producto.",
          tx,
        )
      }

      return product
    })
  },


  // ── activateProduct ──────────────────────────────────────────────────────────

  activateProduct: async (productId: string): Promise<ProductWithVariants> => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    return productRepository.update(productId, {
      productStatus: "ACTIVE",
      isActive: true,
    })
  },


  // ── updateProductDetails ─────────────────────────────────────────────────────

  updateProductDetails: async (
    productId: string,
    payload: UpdateProductPayload,
  ): Promise<ProductWithVariants> => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    return productRepository.update(productId, payload)
  },


  // ── deactivateProduct ────────────────────────────────────────────────────────

  deactivateProduct: async (productId: string): Promise<ProductWithVariants> => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    return productRepository.update(productId, {
      productStatus: "INACTIVE",
      isActive: false,
    })
  },


  // ── deleteProduct ────────────────────────────────────────────────────────────

  deleteProduct: async (productId: string): Promise<void> => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    const hasHistory = await productRepository.hasSalesOrPurchases(productId)
    if (hasHistory) {
      throw new Error(
        "No se puede eliminar: el producto tiene ventas u órdenes de compra. " +
        "Puede darlo de baja para ocultarlo del catálogo.",
      )
    }

    await productRepository.hardDelete(productId)
  },


  // ── addProductImage ──────────────────────────────────────────────────────────

  addProductImage: async (
    productId: string,
    imageUrl: string,
  ): Promise<ProductWithVariants> => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    return productRepository.update(productId, {
      imageUrls: [...product.imageUrls, imageUrl],
    })
  },


  // ── removeProductImage ───────────────────────────────────────────────────────

  removeProductImage: async (
    productId: string,
    imageUrl: string,
  ): Promise<ProductWithVariants> => {
    const product = await productRepository.findById(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    return productRepository.update(productId, {
      imageUrls: product.imageUrls.filter((url) => url !== imageUrl),
    })
  },


  // ── getProductWithFullDetail ─────────────────────────────────────────────────

  getProductWithFullDetail: async (productId: string) => {
    const product = await productRepository.findByIdWithFullDetail(productId)

    if (!product) {
      throw new ProductNotFoundError(productId)
    }

    return product
  },


  // ── getProducts ──────────────────────────────────────────────────────────────

  getProducts: async (filters: ProductFilters = {}): Promise<ProductWithVariants[]> => {
    return productRepository.findAll(filters)
  },


  // ── getAvailabilityStatus ────────────────────────────────────────────────────

  getAvailabilityStatus: (variants: Array<{ stockLevel: number }>): StockAvailabilityStatus => {
    const totalStock = variants.reduce((sum, v) => sum + v.stockLevel, 0)

    if (totalStock === 0) return STOCK_AVAILABILITY.OUT_OF_STOCK

    if (variants.some((v) => v.stockLevel <= LOW_STOCK_THRESHOLD)) {
      return STOCK_AVAILABILITY.LOW_STOCK
    }

    return STOCK_AVAILABILITY.IN_STOCK
  },

}

// ─── Descripción ──────────────────────────────────────────────────────────────
// Capa de acceso a datos del módulo de productos.
// Único punto de contacto con Prisma para el modelo Product y ProductVariant.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/types/product.types              → ProductWithVariants, ProductFilters
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/product.service.ts
// lib/services/purchase.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import type { ProductWithVariants, ProductFilters } from "@/types/product.types"
import type { Prisma } from "@/generated/prisma/client"

export const productRepository = {

  // ── findAll ──────────────────────────────────────────────────────────────────

  findAll: async (filters: ProductFilters = {}): Promise<ProductWithVariants[]> => {
    const where: Prisma.ProductWhereInput = {}

    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { sku: { contains: filters.searchTerm, mode: "insensitive" } },
        { brand: { contains: filters.searchTerm, mode: "insensitive" } },
      ]
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId
    }

    if (filters.productStatus) {
      where.productStatus = filters.productStatus
    }

    if (filters.onlyActive !== undefined) {
      where.isActive = filters.onlyActive
    }

    if (filters.lowStock) {
      where.variants = {
        some: { stockLevel: { lte: 5 } },
      }
    }

    if (filters.supplierId) {
      where.purchaseItems = {
        some: {
          purchaseOrder: {
            supplierId: filters.supplierId,
          },
        },
      }
    }

    return prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    })
  },


  // ── findById ─────────────────────────────────────────────────────────────────

  findById: async (productId: string): Promise<ProductWithVariants | null> => {
    return prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    })
  },


  // ── findAvailableForPurchase ─────────────────────────────────────────────────

  findAvailableForPurchase: async (): Promise<ProductWithVariants[]> => {
    return prisma.product.findMany({
      where: { purchaseOrderId: null },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    })
  },


  // ── findAvailableForSale ─────────────────────────────────────────────────────

  findAvailableForSale: async (): Promise<ProductWithVariants[]> => {
    return prisma.product.findMany({
      where: { purchaseOrderId: { not: null }, saleOrderId: null, isActive: true },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    })
  },


  // ── findByIdWithFullDetail ───────────────────────────────────────────────────

  findByIdWithFullDetail: async (productId: string) => {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: {
          include: { stockMovements: true },
        },
        saleItems: {
          include: { sale: true },
        },
        purchaseItems: {
          include: { purchaseOrder: true },
        },
      },
    })
  },


  // ── create ───────────────────────────────────────────────────────────────────

  create: async (
    tx: Prisma.TransactionClient,
    data: {
      name: string
      description?: string
      sku?: string
      categoryId?: string
      brand?: string
      tags: string[]
      referenceLinks: string[]
      costPrice?: number
      salePrice: number
      productStatus: "DRAFT" | "ACTIVE" | "INACTIVE"
    },
  ): Promise<{ id: string }> => {
    return tx.product.create({
      data,
      select: { id: true },
    })
  },


  // ── update ───────────────────────────────────────────────────────────────────

  update: async (
    productId: string,
    data: {
      name?: string
      description?: string
      sku?: string
      categoryId?: string | null
      brand?: string
      tags?: string[]
      referenceLinks?: string[]
      costPrice?: number | null
      salePrice?: number
      productStatus?: "DRAFT" | "ACTIVE" | "INACTIVE"
      isActive?: boolean
      imageUrls?: string[]
    },
  ): Promise<ProductWithVariants> => {
    return prisma.product.update({
      where: { id: productId },
      data,
      include: { variants: true },
    })
  },


  // ── createVariant ────────────────────────────────────────────────────────────

  createVariant: async (
    tx: Prisma.TransactionClient,
    data: {
      productId: string
      size?: string | null
      color?: string | null
      stockLevel?: number
      price?: number | null
    },
  ): Promise<{ id: string }> => {
    return tx.productVariant.create({
      data,
      select: { id: true },
    })
  },


  // ── findVariantById ──────────────────────────────────────────────────────────
  
  findVariantById: async (variantId: string) => {
    return prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    })
  },


  // ── hasSalesOrPurchases ──────────────────────────────────────────────────────

  hasSalesOrPurchases: async (productId: string): Promise<boolean> => {
    const [saleItems, purchaseItems] = await Promise.all([
      prisma.saleItem.count({ where: { productId } }),
      prisma.purchaseOrderItem.count({ where: { productId } }),
    ])
    return saleItems > 0 || purchaseItems > 0
  },


  // ── hardDelete ───────────────────────────────────────────────────────────────

  hardDelete: async (productId: string): Promise<void> => {
    await prisma.$transaction(async (tx) => {
      await tx.stockMovement.deleteMany({
        where: { variant: { productId } },
      })
      await tx.productVariant.deleteMany({
        where: { productId },
      })
      await tx.product.delete({
        where: { id: productId },
      })
    })
  },
}

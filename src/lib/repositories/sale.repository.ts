// ─── Descripción ──────────────────────────────────────────────────────────────
// Capa de acceso a datos del módulo de ventas.
// Único punto de contacto con Prisma para el modelo Sale y SaleItem.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/types/sale.types                 → SaleWithItems, SaleFilters
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/sale.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import type { SaleWithItems, SaleFilters } from "@/types/sale.types"
import type { Prisma } from "@/generated/prisma/client"

export const saleRepository = {

  // ── findAll ──────────────────────────────────────────────────────────────────

  findAll: async (
    filters: SaleFilters = {},
  ): Promise<SaleWithItems[]> => {
    const where: Prisma.SaleWhereInput = {}

    if (filters.saleChannel) {
      where.saleChannel = filters.saleChannel
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod
    }

    if (filters.dateFrom || filters.dateTo) {
      where.saleDate = {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      }
    }

    return prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
          },
        },
      },
      orderBy: { saleDate: "desc" },
    })
  },


  // ── findById ─────────────────────────────────────────────────────────────────

  findById: async (saleId: string): Promise<SaleWithItems | null> => {
    return prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
          },
        },
      },
    })
  },


  // ── create ───────────────────────────────────────────────────────────────────

  create: async (
    tx: Prisma.TransactionClient,
    data: {
      saleDate: Date
      saleChannel: string
      paymentMethod: string
      discountAmount: number
      saleTotal: number
      notes?: string
      items: Array<{
        productId: string
        variantId: string
        soldQuantity: number
        unitPrice: number
      }>
    },
  ) => {
    return tx.sale.create({
      data: {
        saleDate: data.saleDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saleChannel: data.saleChannel as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paymentMethod: data.paymentMethod as any,
        discountAmount: data.discountAmount,
        saleTotal: data.saleTotal,
        notes: data.notes,
        items: { create: data.items },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
          },
        },
      },
    })
  },


  // ── countByFilters ───────────────────────────────────────────────────────────

  countByFilters: async (filters: SaleFilters = {}): Promise<number> => {
    const where: Prisma.SaleWhereInput = {}

    if (filters.saleChannel) where.saleChannel = filters.saleChannel
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod
    if (filters.dateFrom || filters.dateTo) {
      where.saleDate = {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      }
    }

    return prisma.sale.count({ where })
  },

}

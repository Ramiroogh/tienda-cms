// ─── Descripción ──────────────────────────────────────────────────────────────
// Capa de acceso a datos del módulo de compras y proveedores.
// Único punto de contacto con Prisma para PurchaseOrder, PurchaseOrderItem y Supplier.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/types/purchase.types             → PurchaseOrderWithItems, SupplierFilters
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/purchase.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import type { PurchaseOrderWithItems } from "@/types/purchase.types"
import type { Prisma } from "@/generated/prisma/client"

export const purchaseRepository = {

  // ── findAllOrders ────────────────────────────────────────────────────────────

  findAllOrders: async (): Promise<PurchaseOrderWithItems[]> => {
    return prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
    })
  },


  // ── findOrderById ────────────────────────────────────────────────────────────

  findOrderById: async (orderId: string): Promise<PurchaseOrderWithItems | null> => {
    return prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
          },
        },
      },
    })
  },


  // ── createOrder ──────────────────────────────────────────────────────────────

  createOrder: async (
    tx: Prisma.TransactionClient,
    data: {
      supplierId: string
      orderStatus: string
      purchaseDate: Date
      invoiceNumber?: string
      totalOrderCost?: number
      notes?: string
    },
  ): Promise<{ id: string }> => {
    return tx.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderStatus: data.orderStatus as any,
        purchaseDate: data.purchaseDate,
        invoiceNumber: data.invoiceNumber,
        totalOrderCost: data.totalOrderCost,
        notes: data.notes,
      },
      select: { id: true },
    })
  },


  // ── createOrderItem ──────────────────────────────────────────────────────────

  createOrderItem: async (
    tx: Prisma.TransactionClient,
    data: {
      purchaseOrderId: string
      productId: string
      variantId?: string
      orderedQuantity: number
      unitCost: number
    },
  ): Promise<void> => {
    await tx.purchaseOrderItem.create({ data })
  },


  // ── updateOrderStatus ────────────────────────────────────────────────────────

  updateOrderStatus: async (
    orderId: string,
    data: {
      orderStatus: "PENDIENTE" | "RECIBIDO" | "PARCIAL" | "CANCELADO"
      receivedAt?: Date
    },
  ): Promise<void> => {
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data,
    })
  },


  // ── findAllSuppliers ─────────────────────────────────────────────────────────

  findAllSuppliers: async (filters: { searchTerm?: string; onlyActive?: boolean } = {}) => {
    const where: Prisma.SupplierWhereInput = {}

    if (filters.searchTerm) {
      where.OR = [
        { businessName: { contains: filters.searchTerm, mode: "insensitive" } },
        { contactPerson: { contains: filters.searchTerm, mode: "insensitive" } },
      ]
    }

    if (filters.onlyActive !== undefined) {
      where.isActive = filters.onlyActive
    }

    return prisma.supplier.findMany({
      where,
      orderBy: { businessName: "asc" },
    })
  },


  // ── findSupplierById ─────────────────────────────────────────────────────────

  findSupplierById: async (supplierId: string) => {
    return prisma.supplier.findUnique({
      where: { id: supplierId },
      include: { purchaseOrders: true },
    })
  },


  // ── createSupplier ───────────────────────────────────────────────────────────

  createSupplier: async (data: {
    businessName: string
    contactPerson?: string
    phone?: string
    email?: string
    address?: string
    notes?: string
  }) => {
    return prisma.supplier.create({ data })
  },


  // ── updateSupplier ───────────────────────────────────────────────────────────

  updateSupplier: async (
    supplierId: string,
    data: {
      businessName?: string
      contactPerson?: string
      phone?: string
      email?: string
      address?: string
      notes?: string
      isActive?: boolean
    },
  ) => {
    return prisma.supplier.update({
      where: { id: supplierId },
      data,
    })
  },

}

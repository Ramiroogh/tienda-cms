// ─── Descripción ──────────────────────────────────────────────────────────────
// Server Actions del módulo de ventas.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/services/sale.service        → saleService
// @/lib/validators/sale.schema       → createSaleSchema
// @/lib/errors/domain.errors         → InsufficientStockError,
//                                       ProductNotActiveError, SaleNotFoundError
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/sales/SaleForm.tsx
// components/sales/SaleHistory.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use server"

import { saleService } from "@/lib/services/sale.service"
import { createSaleSchema, saleFiltersSchema } from "@/lib/validators/sale.schema"
import {
  InsufficientStockError,
  ProductNotActiveError,
  SaleNotFoundError,
  ProductNotFoundError,
} from "@/lib/errors/domain.errors"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

export async function registerSaleAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = createSaleSchema.safeParse({
    saleDate: rawData.saleDate ? new Date(rawData.saleDate as string) : undefined,
    saleChannel: rawData.saleChannel,
    paymentMethod: rawData.paymentMethod,
    discountAmount: Number(rawData.discountAmount ?? 0),
    notes: rawData.notes,
    items: JSON.parse((rawData.items as string) ?? "[]"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const result = await saleService.registerSale(parsed.data)
    return { success: true, data: result.sale }
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { success: false, error: error.message }
    }
    if (error instanceof ProductNotActiveError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al registrar la venta." }
  }
}

export async function getSalesAction(
  filters?: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const parsedFilters = saleFiltersSchema.parse(filters ?? {})
    const result = await saleService.getSaleHistory(parsedFilters)
    return { success: true, data: result }
  } catch {
    return { success: false, error: "Error al obtener ventas." }
  }
}

export async function getSaleByIdAction(
  saleId: string,
): Promise<ActionResult> {
  try {
    const sale = await saleService.getSaleById(saleId)
    return { success: true, data: sale }
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al obtener la venta." }
  }
}

export async function registerSaleOrderAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  try {
    const productIds = JSON.parse((rawData.productIds as string) ?? "[]") as Array<{ productId: string; unitPrice: number }>
    if (productIds.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un producto." }
    }

    await saleService.registerSaleOrder({
      saleChannel: rawData.saleChannel as string,
      paymentMethod: rawData.paymentMethod as string,
      discountAmount: rawData.discountAmount ? Number(rawData.discountAmount) : undefined,
      notes: rawData.notes as string,
      productIds,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { success: false, error: error.message }
    }
    if (error instanceof ProductNotActiveError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Error al registrar la venta." }
  }
}

// ─── Descripción ──────────────────────────────────────────────────────────────
// Server Actions del módulo de stock.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/services/stock.service       → stockService
// @/lib/validators/stock.schema      → adjustStockSchema
// @/lib/errors/domain.errors         → VariantNotFoundError,
//                                       ManualAdjustmentNoteRequiredError
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/stock/StockAdjustModal.tsx
// components/stock/StockDashboard.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use server"

import { stockService } from "@/lib/services/stock.service"
import { adjustStockSchema } from "@/lib/validators/stock.schema"
import {
  VariantNotFoundError,
  ManualAdjustmentNoteRequiredError,
} from "@/lib/errors/domain.errors"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

export async function adjustStockAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = adjustStockSchema.safeParse({
    variantId: rawData.variantId,
    newStockLevel: Number(rawData.newStockLevel),
    notes: rawData.notes,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await stockService.adjustStockManually(parsed.data)
    return { success: true }
  } catch (error) {
    if (error instanceof VariantNotFoundError) {
      return { success: false, error: error.message }
    }
    if (error instanceof ManualAdjustmentNoteRequiredError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al ajustar el stock." }
  }
}

export async function getMovementHistoryAction(
  variantId: string,
): Promise<ActionResult> {
  try {
    const movements = await stockService.getMovementHistory(variantId)
    return { success: true, data: movements }
  } catch {
    return { success: false, error: "Error al obtener el historial." }
  }
}

export async function getVariantStockAction(
  variantId: string,
): Promise<ActionResult> {
  try {
    const stockLevel = await stockService.getVariantStockLevel(variantId)
    return { success: true, data: stockLevel }
  } catch {
    return { success: false, error: "Error al obtener el stock." }
  }
}

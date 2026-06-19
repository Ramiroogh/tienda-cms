// ─── Descripción ──────────────────────────────────────────────────────────────
// Schema de validación para ajustes manuales de stock.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// zod                                → z
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/stock.actions.ts
// components/stock/StockAdjustModal.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod"
import { MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH } from "@/lib/constants"

export const adjustStockSchema = z.object({
  variantId: z.string().min(1),
  newStockLevel: z.number().int().min(0, "El stock no puede ser negativo"),
  notes: z.string().min(
    MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH,
    `La nota debe tener al menos ${MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH} caracteres`,
  ),
})

export const stockFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  categoryId: z.string().optional(),
  lowStockOnly: z.boolean().optional(),
})

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>
export type StockFiltersFormValues = z.infer<typeof stockFiltersSchema>

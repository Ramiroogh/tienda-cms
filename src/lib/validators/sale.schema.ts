// ─── Descripción ──────────────────────────────────────────────────────────────
// Schema de validación para el registro de ventas.
// Fuente única de verdad para server y cliente.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// zod                                → z
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/sale.actions.ts
// components/sales/SaleForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod"

const saleItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto"),
  variantId: z.string().min(1, "Debe seleccionar una variante"),
  productName: z.string().min(1),
  soldQuantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().positive("El precio unitario debe ser positivo"),
})

export const createSaleSchema = z.object({
  saleDate: z.date().optional(),
  saleChannel: z.enum(["PRESENCIAL", "INSTAGRAM", "WHATSAPP", "FACEBOOK", "OTRO"], "Seleccione un canal de venta"),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"], "Seleccione un método de pago"),
  discountAmount: z.number().min(0, "El descuento no puede ser negativo").default(0),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Debe agregar al menos un producto"),
})

export const saleFiltersSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  saleChannel: z.enum(["PRESENCIAL", "INSTAGRAM", "WHATSAPP", "FACEBOOK", "OTRO"]).optional(),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"]).optional(),
})

export type CreateSaleFormValues = z.infer<typeof createSaleSchema>
export type SaleFiltersFormValues = z.infer<typeof saleFiltersSchema>

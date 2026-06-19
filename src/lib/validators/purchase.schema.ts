// ─── Descripción ──────────────────────────────────────────────────────────────
// Schema de validación para compras de mercadería y proveedores.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// zod                                → z
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/purchase.actions.ts
// components/purchases/PurchaseForm.tsx
// components/suppliers/SupplierForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod"

// ── Proveedores ───────────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  businessName: z.string().min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const updateSupplierSchema = z.object({
  businessName: z.string().min(2).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ── Compras ───────────────────────────────────────────────────────────────────

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto"),
  variantId: z.string().min(1, "Debe seleccionar una variante"),
  orderedQuantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  unitCost: z.number().positive("El costo unitario debe ser positivo"),
})

export const registerRestockSchema = z.object({
  supplierId: z.string().min(1, "Debe seleccionar un proveedor"),
  purchaseDate: z.date(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "Debe agregar al menos un producto"),
})

export const registerPurchaseNewProductSchema = z.object({
  productName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  referenceLinks: z.array(z.string()).default([]),
  costPrice: z.number().positive().optional(),
  salePrice: z.number().positive("El precio de venta debe ser positivo"),
  variants: z.array(z.object({
    size: z.string().optional(),
    color: z.string().optional(),
  })).min(1, "Debe tener al menos una variante"),
  supplierId: z.string().min(1, "Debe seleccionar un proveedor"),
  purchaseDate: z.date(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  purchasedItems: z.array(z.object({
    variantIndex: z.number().int().min(0),
    orderedQuantity: z.number().int().positive(),
    unitCost: z.number().positive(),
  })).min(1, "Debe agregar al menos un ítem"),
})

export type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>
export type RegisterRestockFormValues = z.infer<typeof registerRestockSchema>
export type RegisterPurchaseNewProductFormValues = z.infer<typeof registerPurchaseNewProductSchema>

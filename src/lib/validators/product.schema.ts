// ─── Descripción ──────────────────────────────────────────────────────────────
// Schema de validación para productos y variantes.
// Se reutiliza en Server Action (servidor) y react-hook-form (cliente).
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// zod                                → z
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/product.actions.ts
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod"

export const productVariantSchema = z.object({
  size: z.string().nullish(),
  color: z.string().nullish(),
  stockLevel: z.number().int().min(0).default(0),
  price: z.number().positive().nullish(),
})

export const createProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  referenceLinks: z.array(z.string()).default([]),
  costPrice: z.number().positive("El precio de costo debe ser positivo").optional(),
  salePrice: z.number().positive("El precio de venta debe ser positivo"),
  stock: z.coerce.number().int().min(0).default(0),
  variants: z.array(productVariantSchema).min(1, "Debe tener al menos una variante"),
})

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  referenceLinks: z.array(z.string()).optional(),
  costPrice: z.number().positive().nullable().optional(),
  salePrice: z.number().positive().optional(),
})

export const productFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  categoryId: z.string().optional(),
  productStatus: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
  onlyActive: z.boolean().optional(),
  lowStock: z.boolean().optional(),
})

export type CreateProductFormValues = z.infer<typeof createProductSchema>
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>
export type ProductFiltersFormValues = z.infer<typeof productFiltersSchema>
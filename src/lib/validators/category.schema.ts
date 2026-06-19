// ─── Descripción ──────────────────────────────────────────────────────────────
// Schema de validación para categorías.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// zod                                → z
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/category.actions.ts
// components/products/CategoryForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  parentCategoryId: z.string().optional(),
})

export const renameCategorySchema = z.object({
  categoryId: z.string().min(1),
  newName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>
export type RenameCategoryFormValues = z.infer<typeof renameCategorySchema>

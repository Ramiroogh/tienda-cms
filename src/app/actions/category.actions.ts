// ─── Descripción ──────────────────────────────────────────────────────────────
// Server Actions del módulo de categorías.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/services/category.service   → categoryService
// @/lib/validators/category.schema  → createCategorySchema, renameCategorySchema
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/CategoryManager.tsx
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use server"

import { categoryService } from "@/lib/services/category.service"
import { createCategorySchema, renameCategorySchema } from "@/lib/validators/category.schema"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

export async function createCategoryAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = createCategorySchema.safeParse({
    name: rawData.name,
    parentCategoryId: rawData.parentCategoryId || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const category = await categoryService.createCategory(parsed.data)
    return { success: true, data: category }
  } catch {
    return { success: false, error: "Error al crear la categoría." }
  }
}

export async function renameCategoryAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = renameCategorySchema.safeParse({
    categoryId: rawData.categoryId,
    newName: rawData.newName,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await categoryService.renameCategory(parsed.data.categoryId, parsed.data.newName)
    return { success: true }
  } catch {
    return { success: false, error: "Error al renombrar la categoría." }
  }
}

export async function getCategoriesAction(): Promise<ActionResult> {
  try {
    const categories = await categoryService.getAllCategories()
    return { success: true, data: categories }
  } catch {
    return { success: false, error: "Error al obtener categorías." }
  }
}

export async function getCategoryTreeAction(): Promise<ActionResult> {
  try {
    const tree = await categoryService.getCategoryTree()
    return { success: true, data: tree }
  } catch {
    return { success: false, error: "Error al obtener el árbol de categorías." }
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    await categoryService.deleteCategory(categoryId)
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar la categoría." }
  }
}
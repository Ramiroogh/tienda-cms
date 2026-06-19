// ─── Descripción ──────────────────────────────────────────────────────────────
// Servicio de categorías. Crea y gestiona la jerarquía de categorías.
// Los slugs se auto-generan desde el nombre.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/repositories/category.repository → categoryRepository
// @/types/category.types              → CategoryTreeNode, CreateCategoryPayload
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/actions/category.actions.ts
// ──────────────────────────────────────────────────────────────────────────────

import { categoryRepository } from "@/lib/repositories/category.repository"
import type { CategoryTreeNode, CreateCategoryPayload } from "@/types/category.types"

export const categoryService = {

  // ── createCategory ───────────────────────────────────────────────────────────

  createCategory: async (payload: CreateCategoryPayload) => {
    const trimmed = payload.name.trim()
    const existing = await categoryRepository.findByName(trimmed)
    if (existing) {
      throw new Error(`La categoría "${trimmed}" ya existe.`)
    }

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    return categoryRepository.create({
      name: trimmed,
      slug,
      parentCategoryId: payload.parentCategoryId,
    })
  },


  // ── getAllCategories ─────────────────────────────────────────────────────────

  getAllCategories: async () => {
    return categoryRepository.findAllFlat()
  },


  // ── getCategoryTree ──────────────────────────────────────────────────────────

  getCategoryTree: async (): Promise<CategoryTreeNode[]> => {
    return categoryRepository.buildTree()
  },


  // ── renameCategory ───────────────────────────────────────────────────────────

  renameCategory: async (categoryId: string, newName: string) => {
    const trimmed = newName.trim()
    const existing = await categoryRepository.findByName(trimmed)
    if (existing && existing.id !== categoryId) {
      throw new Error(`La categoría "${trimmed}" ya existe.`)
    }

    const newSlug = trimmed
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    return categoryRepository.rename(categoryId, trimmed, newSlug)
  },


  // ── deleteCategory ───────────────────────────────────────────────────────────

  deleteCategory: async (categoryId: string): Promise<void> => {
    await categoryRepository.delete(categoryId)
  },

}

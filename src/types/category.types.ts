// ─── Descripción ──────────────────────────────────────────────────────────────
// Tipos del módulo de categorías. Jerarquía padre-hijo.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @prisma/client                     → Category
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/category.service.ts
// lib/repositories/category.repository.ts
// ──────────────────────────────────────────────────────────────────────────────

import type { Category } from "@/generated/prisma/client"

export type CategoryWithChildren = Category & {
  children: CategoryWithChildren[]
}

export type CategoryTreeNode = {
  id: string
  name: string
  slug: string
  children: CategoryTreeNode[]
}

export type CreateCategoryPayload = {
  name: string
  parentCategoryId?: string
}

export type RenameCategoryPayload = {
  categoryId: string
  newName: string
}

// ─── Descripción ──────────────────────────────────────────────────────────────
// Capa de acceso a datos del módulo de categorías.
// Soporte de jerarquía padre-hijo para subcategorías.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/prisma                       → prisma (singleton client)
// @/types/category.types             → CategoryTreeNode
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/category.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"
import type { CategoryTreeNode } from "@/types/category.types"
import type { Category } from "@/generated/prisma/client"

export const categoryRepository = {

  // ── findAll ──────────────────────────────────────────────────────────────────

  findAll: async () => {
    return prisma.category.findMany({
      where: { parentCategoryId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })
  },


  // ── findAllFlat ──────────────────────────────────────────────────────────────

  findAllFlat: async (): Promise<Category[]> => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    })
  },


  // ── findByName ───────────────────────────────────────────────────────────────

  findByName: async (name: string): Promise<Category | null> => {
    return prisma.category.findFirst({
      where: { name },
    })
  },


  // ── findById ─────────────────────────────────────────────────────────────────

  findById: async (categoryId: string) => {
    return prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
        children: true,
      },
    })
  },


  // ── create ───────────────────────────────────────────────────────────────────

  create: async (data: {
    name: string
    slug: string
    parentCategoryId?: string
  }): Promise<Category> => {
    return prisma.category.create({ data })
  },


  // ── rename ───────────────────────────────────────────────────────────────────

  rename: async (categoryId: string, newName: string, newSlug: string): Promise<Category> => {
    return prisma.category.update({
      where: { id: categoryId },
      data: { name: newName, slug: newSlug },
    })
  },


  // ── delete ───────────────────────────────────────────────────────────────────

  delete: async (categoryId: string): Promise<void> => {
    await prisma.category.delete({ where: { id: categoryId } })
  },


  // ── buildTree ────────────────────────────────────────────────────────────────

  buildTree: async (): Promise<CategoryTreeNode[]> => {
    const allCategories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    })

    const map = new Map<string, CategoryTreeNode>()
    const roots: CategoryTreeNode[] = []

    for (const cat of allCategories) {
      map.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, children: [] })
    }

    for (const cat of allCategories) {
      const node = map.get(cat.id)!
      if (cat.parentCategoryId) {
        const parent = map.get(cat.parentCategoryId)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    }

    return roots
  },

}

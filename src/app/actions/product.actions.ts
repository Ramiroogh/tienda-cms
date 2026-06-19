// ─── Descripción ──────────────────────────────────────────────────────────────
// Server Actions del módulo de productos.
// Capa de orquestación: valida con Zod → delega en services → devuelve resultado.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/services/product.service    → productService
// @/lib/validators/product.schema   → createProductSchema, updateProductSchema
// @/lib/errors/domain.errors        → ProductNotFoundError
// @/types/product.types             → ProductWithVariants, ProductFilters
// @/lib/prisma                      → prisma
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// components/products/ProductList.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use server"

import { productService } from "@/lib/services/product.service"
import { createProductSchema, updateProductSchema } from "@/lib/validators/product.schema"
import { ProductNotFoundError } from "@/lib/errors/domain.errors"
import type { ProductFilters } from "@/types/product.types"
import { prisma } from "@/lib/prisma"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

function generateSku(): string {
  const min = 10_000_000_000
  const max = 99_999_999_999
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

async function generateUniqueSku(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const sku = generateSku()
    const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } })
    if (!existing) return sku
  }
  throw new Error("No se pudo generar un SKU único después de 10 intentos")
}

export async function createProductAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = createProductSchema.safeParse({
    ...rawData,
    costPrice: rawData.costPrice ? Number(rawData.costPrice) : undefined,
    salePrice: Number(rawData.salePrice),
    variants: JSON.parse((rawData.variants as string) ?? "[]"),
    tags: JSON.parse((rawData.tags as string) ?? "[]"),
    referenceLinks: JSON.parse((rawData.referenceLinks as string) ?? "[]"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const sku = await generateUniqueSku()
    const product = await productService.createProductDraft({
      ...parsed.data,
      sku,
    })
    return { success: true, data: product }
  } catch (error) {
    console.error("createProductAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error al crear el producto." }
  }
}

export async function updateProductAction(
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = updateProductSchema.safeParse({
    ...rawData,
    costPrice: rawData.costPrice ? Number(rawData.costPrice) : null,
    salePrice: rawData.salePrice ? Number(rawData.salePrice) : undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await productService.updateProductDetails(productId, parsed.data)
    return { success: true }
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al actualizar el producto." }
  }
}

export async function activateProductAction(
  productId: string,
): Promise<ActionResult> {
  try {
    await productService.activateProduct(productId)
    return { success: true }
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al activar el producto." }
  }
}

export async function deactivateProductAction(
  productId: string,
): Promise<ActionResult> {
  try {
    await productService.deactivateProduct(productId)
    return { success: true }
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al desactivar el producto." }
  }
}

export async function deleteProductAction(
  productId: string,
): Promise<ActionResult> {
  try {
    await productService.deleteProduct(productId)
    return { success: true }
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Error al eliminar el producto." }
  }
}

export async function getProductsAction(
  filters?: ProductFilters,
): Promise<ActionResult> {
  try {
    const products = await productService.getProducts(filters)
    return { success: true, data: products }
  } catch {
    return { success: false, error: "Error al obtener productos." }
  }
}

export async function getProductByIdAction(
  productId: string,
): Promise<ActionResult> {
  try {
    const product = await productService.getProductWithFullDetail(productId)
    return { success: true, data: product }
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al obtener el producto." }
  }
}

export async function getAvailableForPurchaseAction(): Promise<ActionResult> {
  try {
    const products = await productService.getAvailableForPurchase()
    return { success: true, data: products }
  } catch {
    return { success: false, error: "Error al obtener productos disponibles." }
  }
}

export async function getAvailableForSaleAction(): Promise<ActionResult> {
  try {
    const products = await productService.getAvailableForSale()
    return { success: true, data: products }
  } catch {
    return { success: false, error: "Error al obtener productos disponibles para venta." }
  }
}
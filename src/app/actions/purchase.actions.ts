// ─── Descripción ──────────────────────────────────────────────────────────────
// Server Actions del módulo de compras y proveedores.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/services/purchase.service   → purchaseService
// @/lib/validators/purchase.schema  → registerRestockSchema,
//                                       registerPurchaseNewProductSchema,
//                                       createSupplierSchema, updateSupplierSchema
// @/lib/errors/domain.errors        → SupplierInactiveError,
//                                       PurchaseOrderNotFoundError,
//                                       CannotModifyReceivedOrderError,
//                                       ProductNotFoundError
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/purchases/PurchaseForm.tsx
// components/suppliers/SupplierForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use server"

import { purchaseService } from "@/lib/services/purchase.service"
import { purchaseRepository } from "@/lib/repositories/purchase.repository"
import {
  registerRestockSchema,
  createSupplierSchema,
  updateSupplierSchema,
} from "@/lib/validators/purchase.schema"
import {
  SupplierInactiveError,
  PurchaseOrderNotFoundError,
  CannotModifyReceivedOrderError,
} from "@/lib/errors/domain.errors"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { success: boolean; data?: any; error?: string }

// ── Proveedores ───────────────────────────────────────────────────────────────

export async function createSupplierAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = createSupplierSchema.safeParse(rawData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    const supplier = await purchaseRepository.createSupplier(parsed.data)
    return { success: true, data: supplier }
  } catch {
    return { success: false, error: "Error al crear el proveedor." }
  }
}

export async function updateSupplierAction(
  supplierId: string,
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = updateSupplierSchema.safeParse({
    ...rawData,
    isActive: rawData.isActive === "true",
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await purchaseRepository.updateSupplier(supplierId, parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: "Error al actualizar el proveedor." }
  }
}

export async function getSuppliersAction(
  filters?: { searchTerm?: string; onlyActive?: boolean },
): Promise<ActionResult> {
  try {
    const suppliers = await purchaseRepository.findAllSuppliers(filters)
    return { success: true, data: suppliers }
  } catch {
    return { success: false, error: "Error al obtener proveedores." }
  }
}

export async function getSupplierByIdAction(
  supplierId: string,
): Promise<ActionResult> {
  try {
    const supplier = await purchaseRepository.findSupplierById(supplierId)
    if (!supplier) {
      return { success: false, error: "Proveedor no encontrado." }
    }
    return { success: true, data: supplier }
  } catch {
    return { success: false, error: "Error al obtener el proveedor." }
  }
}

// ── Compras ───────────────────────────────────────────────────────────────────

export async function registerRestockAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData)

  const parsed = registerRestockSchema.safeParse({
    supplierId: rawData.supplierId,
    purchaseDate: rawData.purchaseDate ? new Date(rawData.purchaseDate as string) : new Date(),
    invoiceNumber: rawData.invoiceNumber,
    notes: rawData.notes,
    items: JSON.parse((rawData.items as string) ?? "[]"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  try {
    await purchaseService.registerPurchaseRestock(parsed.data)
    return { success: true }
  } catch (error) {
    if (error instanceof SupplierInactiveError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al registrar la compra." }
  }
}

export async function getPurchaseOrdersAction(): Promise<ActionResult> {
  try {
    const orders = await purchaseService.getPurchaseOrders()
    return { success: true, data: orders }
  } catch {
    return { success: false, error: "Error al obtener órdenes de compra." }
  }
}

export async function getPurchaseOrderByIdAction(
  orderId: string,
): Promise<ActionResult> {
  try {
    const order = await purchaseService.getPurchaseOrderById(orderId)
    return { success: true, data: order }
  } catch (error) {
    if (error instanceof PurchaseOrderNotFoundError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al obtener la orden de compra." }
  }
}

export async function receivePurchaseOrderAction(
  orderId: string,
  receivedItems?: Array<{ itemId: string; receivedQuantity: number }>,
): Promise<ActionResult> {
  try {
    await purchaseService.receivePurchaseOrder(orderId, receivedItems)
    return { success: true }
  } catch (error) {
    if (error instanceof PurchaseOrderNotFoundError) {
      return { success: false, error: error.message }
    }
    if (error instanceof CannotModifyReceivedOrderError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al recibir la orden." }
  }
}

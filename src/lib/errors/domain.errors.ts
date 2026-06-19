// ─── Descripción ──────────────────────────────────────────────────────────────
// Clases de error del dominio. Se usan en services para comunicar
// fallos de negocio de forma tipada y descriptiva.
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/sale.service.ts
// lib/services/stock.service.ts
// lib/services/purchase.service.ts
// ──────────────────────────────────────────────────────────────────────────────

export class InsufficientStockError extends Error {
  constructor(
    public readonly productName: string,
    public readonly availableStock: number,
    public readonly requestedQuantity: number,
  ) {
    super(
      `Stock insuficiente para "${productName}". ` +
      `Disponible: ${availableStock}, solicitado: ${requestedQuantity}.`,
    )
    this.name = "InsufficientStockError"
  }
}

export class ProductNotActiveError extends Error {
  constructor(public readonly productId: string) {
    super(`El producto ${productId} no está activo y no puede venderse.`)
    this.name = "ProductNotActiveError"
  }
}

export class SupplierInactiveError extends Error {
  constructor(public readonly supplierId: string) {
    super(`El proveedor ${supplierId} está inactivo.`)
    this.name = "SupplierInactiveError"
  }
}

export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Producto "${productId}" no encontrado.`)
    this.name = "ProductNotFoundError"
  }
}

export class VariantNotFoundError extends Error {
  constructor(public readonly variantId: string) {
    super(`Variante "${variantId}" no encontrada.`)
    this.name = "VariantNotFoundError"
  }
}

export class PurchaseOrderNotFoundError extends Error {
  constructor(public readonly orderId: string) {
    super(`Orden de compra "${orderId}" no encontrada.`)
    this.name = "PurchaseOrderNotFoundError"
  }
}

export class SaleNotFoundError extends Error {
  constructor(public readonly saleId: string) {
    super(`Venta "${saleId}" no encontrada.`)
    this.name = "SaleNotFoundError"
  }
}

export class ManualAdjustmentNoteRequiredError extends Error {
  constructor() {
    super("El ajuste manual de stock requiere una nota explicativa.")
    this.name = "ManualAdjustmentNoteRequiredError"
  }
}

export class CannotModifyReceivedOrderError extends Error {
  constructor(public readonly orderId: string) {
    super(`La orden de compra "${orderId}" ya fue recibida y no puede modificarse.`)
    this.name = "CannotModifyReceivedOrderError"
  }
}

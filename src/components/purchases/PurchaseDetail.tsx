"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getPurchaseOrderByIdAction } from "@/app/actions/purchase.actions"
import { formatDateTime } from "@/lib/utils/date.utils"
import { formatPriceARS } from "@/lib/utils/currency.utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type PurchaseOrderItemData = {
  id: string
  product: { name: string; salePrice: number | null; costPrice: number | null }
  variant: { size: string | null; color: string | null } | null
  orderedQuantity: number
  unitCost: number
}

type PurchaseOrderData = {
  id: string
  purchaseDate: Date
  totalOrderCost: number | null
  supplier: { businessName: string } | null
  items: PurchaseOrderItemData[]
}

type ItemGroup = {
  productName: string
  items: PurchaseOrderItemData[]
  totalQuantity: number
  totalCost: number
  totalSaleValue: number
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVariantLabel(item: PurchaseOrderItemData): string {
  return [item.variant?.size, item.variant?.color]
    .filter(Boolean)
    .join(" / ") || "Sin variantes"
}

function groupItemsByProduct(items: PurchaseOrderItemData[]): ItemGroup[] {
  const groupsMap = new Map<string, PurchaseOrderItemData[]>()

  for (const item of items) {
    const key = item.product.name
    const group = groupsMap.get(key)
    if (group) {
      group.push(item)
    } else {
      groupsMap.set(key, [item])
    }
  }

  return Array.from(groupsMap.entries()).map(([productName, items]) => ({
    productName,
    items,
    totalQuantity: items.reduce((sum, i) => sum + i.orderedQuantity, 0),
    totalCost: items.reduce(
      (sum, i) => sum + (i.product.costPrice ?? 0) * i.orderedQuantity,
      0,
    ),
    totalSaleValue: items.reduce(
      (sum, i) => sum + (i.product.salePrice ?? 0) * i.orderedQuantity,
      0,
    ),
  }))
}


// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseDetail({ purchaseOrderId }: { purchaseOrderId: string }) {

  // ── State ─────────────────────────────────────────────────────────────────

  const [order, setOrder] = useState<PurchaseOrderData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())


  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    getPurchaseOrderByIdAction(purchaseOrderId).then((result) => {
      if (result.success && result.data) {
        setOrder(result.data as PurchaseOrderData)
      } else {
        setError(result.error ?? "Error al cargar la orden.")
      }
    }).finally(() => {
      setIsLoading(false)
    })
  }, [purchaseOrderId])


  // ── Derived values ─────────────────────────────────────────────────────────

  const itemGroups = order ? groupItemsByProduct(order.items) : []

  const computedProductCost = itemGroups.reduce((sum, g) => sum + g.totalCost, 0)
  const shippingCost = Math.max(0, (order?.totalOrderCost ?? 0) - computedProductCost)
  const orderTotalCost = order?.totalOrderCost ?? 0
  const orderTotalSale = itemGroups.reduce((sum, g) => sum + g.totalSaleValue, 0)
  const profit = orderTotalSale - orderTotalCost


  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGroupToggle = (productName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(productName)) {
        next.delete(productName)
      } else {
        next.add(productName)
      }
      return next
    })
  }


  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando orden...</p>
        </div>
      </div>
    )
  }


  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !order) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? "No se pudo cargar la orden de compra."}
      </div>
    )
  }


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Order info card ────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Proveedor
            </p>
            <p className="mt-1 text-sm font-medium">
              {order.supplier?.businessName ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Fecha
            </p>
            <p className="mt-1 text-sm">{formatDateTime(order.purchaseDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Envío
            </p>
            <p className="mt-1 text-sm">
              {shippingCost > 0 ? formatPriceARS(shippingCost) : "Sin envío"}
            </p>
          </div>
        </div>
      </div>


      {/* ── Items grouped by product ───────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-3">
          <h2 className="text-sm font-semibold">Productos</h2>
        </div>

        <div className="divide-y">
          {itemGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.productName)

            return (
              <div key={group.productName}>

                {/* ── Group header ─────────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => handleGroupToggle(group.productName)}
                  className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <span className="shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </span>

                  <div className="flex flex-1 items-center gap-4">
                    <span className="flex-1 text-sm font-medium">
                      {group.productName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {group.totalQuantity} uds.
                    </span>
                    <span className="w-28 text-right text-sm font-medium tabular-nums">
                      {formatPriceARS(group.totalCost)}
                    </span>
                  </div>
                </button>

                {/* ── Expanded items ────────────────────────────────────── */}
                {isExpanded && (
                  <div className="border-t bg-muted/30">
                    <div className="flex items-center gap-4 px-6 py-1.5 pl-12 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="w-32">Variante</span>
                      <span className="flex-1 text-right">Costo uni.</span>
                      <span className="w-28 text-right">Subtotal costo</span>
                      <span className="flex-1 text-right">Venta uni.</span>
                      <span className="w-28 text-right">Subtotal venta</span>
                    </div>
                    <div className="divide-y">
                      {group.items.map((item) => {
                        const costUnit = item.product.costPrice ?? 0
                        const saleUnit = item.product.salePrice ?? 0
                        const costSubtotal = costUnit * item.orderedQuantity
                        const saleSubtotal = saleUnit * item.orderedQuantity
                        const variantLabel = getVariantLabel(item)

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 px-6 py-2.5 pl-12"
                          >
                            <span className="w-32 text-sm text-muted-foreground">
                              {variantLabel}
                            </span>
                            <span className="flex-1 text-right text-sm tabular-nums text-muted-foreground">
                              {item.orderedQuantity} × {formatPriceARS(costUnit)}
                            </span>
                            <span className="w-28 text-right text-sm tabular-nums font-medium">
                              {formatPriceARS(costSubtotal)}
                            </span>
                            <span className="flex-1 text-right text-sm tabular-nums text-muted-foreground">
                              {item.orderedQuantity} × {formatPriceARS(saleUnit)}
                            </span>
                            <span className="w-28 text-right text-sm tabular-nums font-medium">
                              {formatPriceARS(saleSubtotal)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )
          })}
        </div>
      </div>


      {/* ── Financial Summary ──────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-3">
          <h2 className="text-sm font-semibold">Resumen financiero</h2>
        </div>

        <div className="grid grid-cols-3 divide-x">
          <div className="px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Costo
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatPriceARS(orderTotalCost)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Productos + envío
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Venta
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-sky-700">
              {formatPriceARS(orderTotalSale)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Precio de venta
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ganancia Real
            </p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${
                profit >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {profit >= 0 ? "+" : ""}{formatPriceARS(profit)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Venta − Costo
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

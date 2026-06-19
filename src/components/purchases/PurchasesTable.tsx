// ─── Descripción ──────────────────────────────────────────────────────────────
// Tabla de órdenes de compra con búsqueda, filtros y paginación.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions      → getPurchaseOrdersAction
// @/components/ui/table               → Table, TableBody, TableCell, TableHead,
//                                        TableHeader, TableRow
// @/components/ui/button              → Button
// @/components/ui/dropdown-menu       → DropdownMenu, DropdownMenuContent,
//                                        DropdownMenuItem, DropdownMenuTrigger
// @/lib/utils/currency.utils          → formatPriceARS
// @/lib/utils/date.utils              → formatDateShort
// next/navigation                     → useRouter
// lucide-react                        → Search, MoreHorizontal, ChevronLeft,
//                                        ChevronRight
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/purchases/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPurchaseOrdersAction, deletePurchaseOrderAction } from "@/app/actions/purchase.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"
import { formatDateShort } from "@/lib/utils/date.utils"
import { Toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 11

// ─── Types ────────────────────────────────────────────────────────────────────

type PurchaseItemShape = {
  id: string
  orderedQuantity: number
  product: { name: string; costPrice: number | null }
}

type PurchaseRow = {
  id: string
  purchaseDate: Date
  totalOrderCost: number | null
  supplier: { businessName: string } | null
  items: PurchaseItemShape[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchasesTable() {
  const router = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────

  const [orders, setOrders] = useState<PurchaseRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDeletedToast, setShowDeletedToast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)


  // ── Check URL for success param ─────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has("success")) {
      setShowSuccess(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])


  // ── fetchOrders ───────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getPurchaseOrdersAction()
      if (result.success && result.data) {
        setOrders(result.data as PurchaseRow[])
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])


  // ── Client-side search & filter ─────────────────────────────────────────────

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm.trim() ||
      order.supplier?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    return matchesSearch
  })


  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const pageItems = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE)


  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetail = (orderId: string) => {
    router.push(`/purchases/${orderId}`)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }


  // ── Delete ──────────────────────────────────────────────────────────────

  const handleOrderDelete = async (orderId: string) => {
    setDeletingId(null)
    const result = await deletePurchaseOrderAction(orderId)
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      setShowDeletedToast(true)
    } else {
      setError(result.error ?? "Error al eliminar la orden.")
    }
  }


  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando órdenes...</p>
        </div>
      </div>
    )
  }


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border bg-card">

      {/* ── Toast Notification ──────────────────────────────────────────────── */}
      {showSuccess && (
        <Toast
          message="Orden de compra creada correctamente."
          variant="success"
          onClose={() => setShowSuccess(false)}
        />
      )}

      {showDeletedToast && (
        <Toast
          message="Orden de compra eliminada correctamente."
          variant="success"
          onClose={() => setShowDeletedToast(false)}
        />
      )}

      {/* ── Confirm Delete Dialog ──────────────────────────────── */}
      <ConfirmDialog
        open={deletingId !== null}
        title="Eliminar orden de compra"
        message="¿Estás seguro de eliminar esta orden? Los productos quedarán disponibles para nuevas órdenes."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => handleOrderDelete(deletingId!)}
        onCancel={() => setDeletingId(null)}
      />

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-6 py-4">
        {error && (
          <div className="w-full rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por proveedor o producto..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {pageItems.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          {orders.length === 0
            ? "No hay órdenes de compra registradas."
            : "No se encontraron órdenes con ese criterio."}
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Envío</TableHead>
                <TableHead>Costo total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => handleViewDetail(order.id)}
                >
                  <TableCell className="text-sm">
                    {formatDateShort(order.purchaseDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.supplier?.businessName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {(() => {
                      const productCost = order.items.reduce(
                        (sum, item) => sum + (item.product.costPrice ?? 0) * item.orderedQuantity,
                        0,
                      )
                      const shipping = Math.max(0, (order.totalOrderCost ?? 0) - productCost)
                      return shipping > 0 ? formatPriceARS(shipping) : "Sin envío"
                    })()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {order.totalOrderCost != null
                      ? formatPriceARS(order.totalOrderCost)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleViewDetail(order.id)}
                        >
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive"
                          onClick={() => setDeletingId(order.id)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                  className="h-8 w-8 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                  className="h-8 w-8 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
import { getPurchaseOrdersAction } from "@/app/actions/purchase.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"
import { formatDateShort } from "@/lib/utils/date.utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 11

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  RECIBIDO: "Recibido",
  PARCIAL: "Parcial",
  CANCELADO: "Cancelado",
}

const ORDER_STATUS_VALUES = ["", "PENDIENTE", "RECIBIDO", "PARCIAL", "CANCELADO"] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type PurchaseItemShape = {
  id: string
  product: { name: string }
}

type PurchaseRow = {
  id: string
  purchaseDate: Date
  invoiceNumber: string | null
  orderStatus: string
  totalOrderCost: number | null
  supplier: { businessName: string }
  items: PurchaseItemShape[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchasesTable() {
  const router = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────

  const [orders, setOrders] = useState<PurchaseRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)


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
      order.supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    const matchesStatus = !statusFilter || order.orderStatus === statusFilter

    return matchesSearch && matchesStatus
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

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
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

      {/* ── Search & Filters ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-6 py-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por proveedor, factura o producto..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {ORDER_STATUS_VALUES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
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
                <TableHead>Factura</TableHead>
                <TableHead>Estado</TableHead>
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
                    {order.supplier.businessName}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.invoiceNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
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

// ─── Descripción ──────────────────────────────────────────────────────────────
// Tabla de ventas con búsqueda, filtros y paginación.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/sale.actions          → getSalesAction
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
// app/sales/page.tsx
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
import { getSalesAction } from "@/app/actions/sale.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"
import { formatDateShort } from "@/lib/utils/date.utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 11

const SALE_CHANNEL_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  OTRO: "Otro",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleItemShape = {
  id: string
  product: { name: string }
}

type SaleRow = {
  id: string
  saleDate: Date
  saleChannel: string
  paymentMethod: string
  saleTotal: number
  items: SaleItemShape[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesTable() {
  const router = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────

  const [sales, setSales] = useState<SaleRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [channelFilter, setChannelFilter] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)


  // ── fetchSales ────────────────────────────────────────────────────────────

  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (channelFilter) filters.saleChannel = channelFilter
      if (paymentFilter) filters.paymentMethod = paymentFilter
      const result = await getSalesAction(filters)
      if (result.success && result.data) {
        setSales(result.data.sales as SaleRow[])
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false)
    }
  }, [channelFilter, paymentFilter])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])


  // ── Client-side search ────────────────────────────────────────────────────

  const filteredSales = sales.filter((sale) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const itemMatch = sale.items.some((item) =>
      item.product.name.toLowerCase().includes(term),
    )
    return itemMatch
  })


  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const pageItems = filteredSales.slice(startIndex, startIndex + PAGE_SIZE)


  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetail = (saleId: string) => {
    router.push(`/sales/${saleId}`)
  }

  const handleChannelChange = (value: string) => {
    setChannelFilter(value)
    setCurrentPage(1)
  }

  const handlePaymentChange = (value: string) => {
    setPaymentFilter(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }


  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando ventas...</p>
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
            placeholder="Buscar por producto..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={channelFilter}
          onChange={(e) => handleChannelChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los canales</option>
          {Object.entries(SALE_CHANNEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => handlePaymentChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los pagos</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {pageItems.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          {sales.length === 0
            ? "No hay ventas registradas."
            : "No se encontraron ventas con ese criterio."}
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer"
                  onClick={() => handleViewDetail(sale.id)}
                >
                  <TableCell className="text-sm">
                    {formatDateShort(sale.saleDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {SALE_CHANNEL_LABELS[sale.saleChannel] ?? sale.saleChannel}
                  </TableCell>
                  <TableCell className="text-sm">
                    {PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sale.items.length}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatPriceARS(sale.saleTotal)}
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
                          onClick={() => handleViewDetail(sale.id)}
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

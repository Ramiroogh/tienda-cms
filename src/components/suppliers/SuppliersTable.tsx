// ─── Descripción ──────────────────────────────────────────────────────────────
// Tabla de proveedores con búsqueda, menú de acciones y paginación.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions       → getSuppliersAction
// @/components/ui/table               → Table, TableBody, TableCell, TableHead,
//                                        TableHeader, TableRow
// @/components/ui/button              → Button
// @/components/ui/dropdown-menu       → DropdownMenu, DropdownMenuContent,
//                                        DropdownMenuItem, DropdownMenuSeparator,
//                                        DropdownMenuTrigger
// @/lib/utils/date.utils              → formatDateShort
// lucide-react                        → MoreHorizontal, Search, ChevronLeft,
//                                        ChevronRight, Building2
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/suppliers/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ChevronLeft, ChevronRight, Search, Building2 } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSuppliersAction } from "@/app/actions/purchase.actions"
import { formatDateShort } from "@/lib/utils/date.utils"

type SupplierRow = {
  id: string
  businessName: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  createdAt: Date
}

const PAGE_SIZE = 11

export function SuppliersTable() {
  const router = useRouter()

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // ── fetchSuppliers ──────────────────────────────────────────────────────────

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getSuppliersAction({ searchTerm })
      if (result.success && result.data) {
        setSuppliers(result.data as SupplierRow[])
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(suppliers.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const pageItems = suppliers.slice(startIndex, startIndex + PAGE_SIZE)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleView = (supplierId: string) => {
    router.push(`/suppliers/${supplierId}`)
  }

  const handleEdit = (supplierId: string) => {
    router.push(`/suppliers/${supplierId}`)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-1 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border bg-card">
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="h-9 w-72 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Registrado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageItems.map((supplier) => (
              <TableRow
                key={supplier.id}
                className="cursor-pointer"
                onClick={() => handleView(supplier.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{supplier.businessName}</span>
                      {!supplier.isActive && (
                        <span className="text-xs text-destructive">Inactivo</span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm">{supplier.contactPerson ?? "—"}</span>
                </TableCell>

                <TableCell>
                  <span className="text-sm">{supplier.phone ?? "—"}</span>
                </TableCell>

                <TableCell>
                  <span className="text-sm">{supplier.email ?? "—"}</span>
                </TableCell>

                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {formatDateShort(supplier.createdAt)}
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleView(supplier.id)}>
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(supplier.id)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Dar de baja
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {pageItems.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Sin resultados para esta búsqueda" : "No hay proveedores registrados"}
            </p>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, suppliers.length)} de {suppliers.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
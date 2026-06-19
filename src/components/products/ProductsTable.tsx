// ─── Descripción ──────────────────────────────────────────────────────────────
// Tabla de productos con búsqueda, selección múltiple, menú de acciones y paginación.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductsAction, activateProductAction,
//                                        deactivateProductAction
// @/components/ui/table               → Table, TableBody, TableCell, TableHead,
//                                        TableHeader, TableRow
// @/components/ui/button              → Button
// @/components/ui/dropdown-menu       → DropdownMenu, DropdownMenuContent,
//                                        DropdownMenuItem, DropdownMenuSeparator,
//                                        DropdownMenuTrigger
// @/lib/utils/currency.utils          → formatPriceARS
// @/lib/utils/date.utils              → formatDateShort
// @/lib/constants                     → PRODUCT_STATUS_BADGE
// @/types/product.types               → ProductWithVariants
// lucide-react                        → MoreHorizontal, Search, ChevronLeft, ChevronRight
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/page.tsx
// components/suppliers/SupplierDetail.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getProductsAction,
  activateProductAction,
  deactivateProductAction,
  deleteProductAction,
} from "@/app/actions/product.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"
import { formatDateShort } from "@/lib/utils/date.utils"
import { PRODUCT_STATUS_BADGE } from "@/lib/constants"
import type { ProductWithVariants } from "@/types/product.types"
import type { ProductVariant } from "@/generated/prisma/client"
import { VariantInfoModal } from "@/components/products/VariantInfoModal"
import { ConfirmDeleteModal } from "@/components/products/ConfirmDeleteModal"

const PAGE_SIZE = 11

export function ProductsTable({ onEdit, supplierId }: { onEdit?: (id: string) => void; supplierId?: string }) {
  const router = useRouter()

  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [variantModalProduct, setVariantModalProduct] = useState<ProductWithVariants | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithVariants | null>(null)

  function getPriceDisplay(variants: ProductVariant[], salePrice: number) {
    const prices = variants.map(v => v.price).filter((p): p is number => p != null)
    if (variants.length <= 1) return { type: "single" as const, price: salePrice }
    if (prices.length === 0) return { type: "single" as const, price: salePrice }
    if (new Set(prices).size === 1) return { type: "single" as const, price: prices[0] }
    return { type: "mixed" as const }
  }

  // ── fetchProducts ──────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: Record<string, string | boolean> = { searchTerm }
      if (supplierId) filters.supplierId = supplierId
      const result = await getProductsAction(filters)
      if (result.success && result.data) {
        setProducts(result.data as ProductWithVariants[])
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, supplierId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const pageItems = products.slice(startIndex, startIndex + PAGE_SIZE)

  // ── Selection ──────────────────────────────────────────────────────────────

  const allPageIds = pageItems.map((p) => p.id)
  const isAllSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds)
      allPageIds.forEach((id) => next.delete(id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      allPageIds.forEach((id) => next.add(id))
      setSelectedIds(next)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleEdit = (productId: string) => {
    if (onEdit) onEdit(productId)
    else router.push(`/products/${productId}`)
  }

  const handleActivate = async (productId: string) => {
    await activateProductAction(productId)
    fetchProducts()
  }

  const handleDeactivate = async (productId: string) => {
    await deactivateProductAction(productId)
    fetchProducts()
  }

  const handleBulkEdit = () => {
    if (selectedIds.size === 1) {
      handleEdit([...selectedIds][0])
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <div className="h-9 w-80 animate-pulse rounded-lg bg-muted" />
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
    <>
      <div className="rounded-xl border bg-card">
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="h-9 w-72 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {selectedIds.size > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} seleccionado(s)
          </span>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
              </TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageItems.map((product) => {
              const statusConfig = PRODUCT_STATUS_BADGE[product.productStatus as keyof typeof PRODUCT_STATUS_BADGE]
              const mainStock = product.variants.reduce((sum, v) => sum + v.stockLevel, 0)
              const isSelected = selectedIds.has(product.id)

              return (
                <TableRow
                  key={product.id}
                  data-selected={isSelected || undefined}
                  className="cursor-pointer data-[selected]:bg-muted/50"
                  onClick={() => handleEdit(product.id)}
                >
                  <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(product.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                      {statusConfig.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className={mainStock <= 5 ? "font-medium text-destructive" : ""}>
                      {mainStock} u.
                    </span>
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {(() => {
                      const display = getPriceDisplay(product.variants, product.salePrice)
                      if (display.type === "mixed") {
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setVariantModalProduct(product)
                            }}
                            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                          >
                            Con variantes
                          </button>
                        )
                      }
                      return formatPriceARS(display.price)
                    })()}
                  </TableCell>

                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {formatDateShort(product.createdAt)}
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                          Editar
                        </DropdownMenuItem>
                        {product.productStatus === "ACTIVE" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeactivate(product.id)}
                          >
                            Dar de baja
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(product.id)}>
                            Activar
                          </DropdownMenuItem>
                        )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(product)}
                    >
                      Eliminar
                    </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {pageItems.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Sin resultados para esta búsqueda" : "No hay productos registrados"}
            </p>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, products.length)} de {products.length}
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

      {variantModalProduct && (
        <VariantInfoModal
          isOpen={!!variantModalProduct}
          productName={variantModalProduct.name}
          variants={variantModalProduct.variants}
          onClose={() => setVariantModalProduct(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name ?? ""}
        title="Eliminar producto"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          const result = await deleteProductAction(deleteTarget.id)
          setDeleteTarget(null)
          if (!result.success) {
            throw new Error(result.error)
          }
          fetchProducts()
        }}
      />
    </>
  )
}
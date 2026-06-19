// ─── Descripción ──────────────────────────────────────────────────────────────
// Formulario de orden de compra. Muestra productos sin orden de compra asignada
// y permite seleccionarlos para crear una nueva orden.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions      → getAvailableForPurchaseAction
// @/app/actions/purchase.actions     → registerPurchaseOrderAction,
//                                       getSuppliersAction
// @/components/ui/table              → Table, TableBody, TableCell, TableHead,
//                                       TableHeader, TableRow
// @/components/ui/button             → Button
// @/lib/utils/date.utils             → formatDateShort
// next/navigation                    → useRouter
// lucide-react                       → Search, Package
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/purchases/new/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Package, CalendarIcon } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { getAvailableForPurchaseAction } from "@/app/actions/product.actions"
import { registerPurchaseOrderAction, getSuppliersAction } from "@/app/actions/purchase.actions"

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductVariant = { id: string; size: string | null; color: string | null; stockLevel: number; price: number | null }

type ProductItem = {
  id: string
  name: string
  sku: string | null
  costPrice: number | null
  salePrice: number
  variants: ProductVariant[]
}

type SupplierItem = { id: string; businessName: string; isActive: boolean }

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseForm() {
  const router = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────

  const [products, setProducts] = useState<ProductItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const [supplierId, setSupplierId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined)
  const [shippingCost, setShippingCost] = useState("")
  const [notes, setNotes] = useState("")


  // ── Fetch data ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const [productsResult, suppliersResult] = await Promise.all([
        getAvailableForPurchaseAction(),
        getSuppliersAction({ onlyActive: true }),
      ])
      if (productsResult.success) setProducts(productsResult.data as ProductItem[])
      if (suppliersResult.success) setSuppliers(suppliersResult.data as SupplierItem[])
      setIsLoading(false)
    }
    load()
  }, [])


  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) =>
    !searchTerm.trim() ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleProduct = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }


  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (selectedIds.size === 0) { setError("Debe seleccionar al menos un producto."); return }

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.set("supplierId", supplierId)
    formData.set("purchaseDate", purchaseDate ? purchaseDate.toISOString() : "")
    formData.set("shippingCost", shippingCost)
    formData.set("notes", notes)
    formData.set("productIds", JSON.stringify([...selectedIds]))

    const result = await registerPurchaseOrderAction(formData)
    setIsSubmitting(false)

    if (result.success) {
      window.location.href = "/purchases?success=1"
    } else {
      setError(result.error ?? "Error al registrar la orden.")
    }
  }


  // ── Loading & Empty States ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando productos disponibles...</p>
        </div>
      </div>
    )
  }


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Supplier, Date & Shipping ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Proveedor</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar proveedor...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.businessName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de compra</label>
          <DatePicker
            selected={purchaseDate}
            onSelect={setPurchaseDate}
            placeholder="Seleccionar fecha..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Costo de envío ($)</label>
          <input
            type="number"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            min="0"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* ── Product search ────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto por nombre o SKU..."
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* ── Available products ────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay productos disponibles. Crea productos en{" "}
            <a href="/products/new" className="text-primary hover:underline">Productos</a> primero.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron productos con ese criterio.</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id))}
                    onChange={() => {
                      const allSelected = filteredProducts.every((p) => selectedIds.has(p.id))
                      const next = new Set(selectedIds)
                      for (const p of filteredProducts) {
                        if (allSelected) next.delete(p.id)
                        else next.add(p.id)
                      }
                      setSelectedIds(next)
                    }}
                  />
                </TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Stock total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockLevel, 0)
                return (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => toggleProduct(product.id)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium">{product.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.sku ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.variants.length > 1
                        ? product.variants.map((v) => [v.size, v.color].filter(Boolean).join(" / ")).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {product.costPrice != null ? `$${product.costPrice}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{totalStock}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>{selectedIds.size}</strong> producto{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/purchases")}
          className="cursor-pointer"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedIds.size === 0}
          className="cursor-pointer"
        >
          {isSubmitting ? "Guardando..." : "Crear Orden de Compra"}
        </Button>
      </div>

    </div>
  )
}

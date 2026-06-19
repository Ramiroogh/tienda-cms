// ─── Descripción ──────────────────────────────────────────────────────────────
// Formulario de orden de venta. Muestra productos disponibles para vender
// y permite seleccionarlos para crear una nueva orden de venta.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions      → getAvailableForSaleAction
// @/app/actions/sale.actions         → registerSaleOrderAction
// @/components/ui/table              → Table, TableBody, TableCell, TableHead,
//                                       TableHeader, TableRow
// @/components/ui/button             → Button
// next/navigation                    → useRouter
// lucide-react                       → Search, ShoppingBag
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/sales/new/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ShoppingBag } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getAvailableForSaleAction } from "@/app/actions/product.actions"
import { registerSaleOrderAction } from "@/app/actions/sale.actions"

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductVariant = { id: string; size: string | null; color: string | null; stockLevel: number; price: number | null }

type ProductItem = {
  id: string
  name: string
  sku: string | null
  salePrice: number
  variants: ProductVariant[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SaleForm() {
  const router = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────

  const [products, setProducts] = useState<ProductItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [saleChannel, setSaleChannel] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [notes, setNotes] = useState("")

  // Selected products with custom unit price
  const [selectedMap, setSelectedMap] = useState(new Map<string, number>())


  // ── Fetch data ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const result = await getAvailableForSaleAction()
      if (result.success) setProducts(result.data as ProductItem[])
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

  const toggleProduct = (productId: string) => {
    const next = new Map(selectedMap)
    if (next.has(productId)) {
      next.delete(productId)
    } else {
      const product = products.find((p) => p.id === productId)
      next.set(productId, product?.salePrice ?? 0)
    }
    setSelectedMap(next)
  }

  const updatePrice = (productId: string, price: number) => {
    const next = new Map(selectedMap)
    next.set(productId, price)
    setSelectedMap(next)
  }

  const subtotal = [...selectedMap.entries()].reduce(
    (sum, [, price]) => sum + price,
    0,
  )
  const discount = Number(discountAmount) || 0
  const saleTotal = subtotal - discount


  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!saleChannel) { setError("Debe seleccionar un canal de venta."); return }
    if (!paymentMethod) { setError("Debe seleccionar un método de pago."); return }
    if (selectedMap.size === 0) { setError("Debe seleccionar al menos un producto."); return }

    setIsSubmitting(true)
    setError(null)

    const productIds = [...selectedMap.entries()].map(([productId, unitPrice]) => ({
      productId,
      unitPrice,
    }))

    const formData = new FormData()
    formData.set("saleChannel", saleChannel)
    formData.set("paymentMethod", paymentMethod)
    formData.set("discountAmount", discountAmount)
    formData.set("notes", notes)
    formData.set("productIds", JSON.stringify(productIds))

    const result = await registerSaleOrderAction(formData)
    if (result.success) {
      router.push("/sales")
      router.refresh()
    } else {
      setError(result.error ?? "Error al registrar la venta.")
      setIsSubmitting(false)
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

      {/* ── Channel & Payment ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Canal de venta *</label>
          <select
            value={saleChannel}
            onChange={(e) => setSaleChannel(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar...</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Método de pago *</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar...</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>

      {/* ── Discount & Notes ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Descuento ($)</label>
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
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
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay productos disponibles para vender. Asegúrate de haber creado una orden de compra primero.
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
                    checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedMap.has(p.id))}
                    onChange={() => {
                      const allSelected = filteredProducts.every((p) => selectedMap.has(p.id))
                      const next = new Map(selectedMap)
                      for (const p of filteredProducts) {
                        if (allSelected) next.delete(p.id)
                        else next.set(p.id, p.salePrice)
                      }
                      setSelectedMap(next)
                    }}
                  />
                </TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio venta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockLevel, 0)
                const currentPrice = selectedMap.get(product.id) ?? product.salePrice
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
                        checked={selectedMap.has(product.id)}
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
                    <TableCell className="text-sm">{totalStock}</TableCell>
                    <TableCell>
                      {selectedMap.has(product.id) ? (
                        <input
                          type="number"
                          value={currentPrice}
                          onChange={(e) => updatePrice(product.id, Number(e.target.value))}
                          min="0"
                          className="w-24 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          ${product.salePrice}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      {selectedMap.size > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              <strong>{selectedMap.size}</strong> producto{selectedMap.size !== 1 ? "s" : ""} seleccionado{selectedMap.size !== 1 ? "s" : ""}
            </p>
            <div className="text-right">
              <p className="text-muted-foreground">Subtotal: ${subtotal}</p>
              {discount > 0 && <p className="text-muted-foreground">Descuento: -${discount}</p>}
              <p className="font-medium">Total: ${saleTotal}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/sales")}
          className="cursor-pointer"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedMap.size === 0 || !saleChannel || !paymentMethod}
          className="cursor-pointer"
        >
          {isSubmitting ? "Registrando..." : "Registrar Venta"}
        </Button>
      </div>

    </div>
  )
}

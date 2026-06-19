// ─── Descripción ──────────────────────────────────────────────────────────────
// Tabla simple de productos con búsqueda básica.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions         → getProductsAction
// @/lib/types/product.types             → ProductWithVariants
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/dashboard/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect } from "react"
import { getProductsAction } from "@/app/actions/product.actions"
import type { ProductWithVariants } from "@/types/product.types"
import type { ProductVariant } from "@/generated/prisma/client"
import { VariantInfoModal } from "@/components/products/VariantInfoModal"

type ProductTableProps = {
  initialProducts?: ProductWithVariants[]
}

export function ProductTable({ initialProducts }: ProductTableProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts || [])
  const [isLoading, setIsLoading] = useState<boolean>(!!initialProducts)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [variantModalProduct, setVariantModalProduct] = useState<ProductWithVariants | null>(null)

  function getPriceDisplay(variants: ProductVariant[], salePrice: number) {
    const prices = variants.map(v => v.price).filter((p): p is number => p != null)
    if (variants.length <= 1) return { type: "single" as const, price: salePrice }
    if (prices.length === 0) return { type: "single" as const, price: salePrice }
    if (new Set(prices).size === 1) return { type: "single" as const, price: prices[0] }
    return { type: "mixed" as const }
  }

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const result = await getProductsAction({ searchTerm })
        if (result.success && result.data) {
          setProducts(result.data as ProductWithVariants[])
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!initialProducts) {
      fetchProducts()
    }
  }, [searchTerm, initialProducts])

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:w-80"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Producto</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Precio</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                    {product.productStatus === "ACTIVE" && "Activo"}
                    {product.productStatus === "DRAFT" && "Borrador"}
                    {product.productStatus === "INACTIVE" && "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={product.variants.reduce((sum, v) => sum + v.stockLevel, 0) <= 5 ? "font-medium text-destructive" : ""}>
                    {product.variants.reduce((sum, v) => sum + v.stockLevel, 0)} u.
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {(() => {
                    const display = getPriceDisplay(product.variants, product.salePrice)
                    if (display.type === "mixed") {
                      return (
                        <button
                          onClick={() => setVariantModalProduct(product)}
                          className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          Con variantes
                        </button>
                      )
                    }
                    return `$${display.price.toFixed(2)}`
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay productos para mostrar</p>
          </div>
        )}
      </div>
    </div>

      {variantModalProduct && (
        <VariantInfoModal
          isOpen={!!variantModalProduct}
          productName={variantModalProduct.name}
          variants={variantModalProduct.variants}
          onClose={() => setVariantModalProduct(null)}
        />
      )}
    </>
  )
}
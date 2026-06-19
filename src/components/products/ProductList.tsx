// ─── Descripción ──────────────────────────────────────────────────────────────
// Listado de productos con enlace a detalle y edición.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductsAction
// @/lib/utils/currency.utils          → formatPriceARS
// @/types/product.types               → STOCK_AVAILABILITY
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getProductsAction } from "@/app/actions/product.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"
import Link from "next/link"

export async function ProductList() {
  const result = await getProductsAction({ onlyActive: true })

  if (!result.success) {
    return <p className="product-list__error">Error al cargar productos.</p>
  }

  type ProductRow = { id: string; name: string; sku: string | null; salePrice: number; productStatus: string; variants: Array<{ stockLevel: number }> }
  const products = (result.data ?? []) as ProductRow[]

  if (products.length === 0) {
    return <p className="product-list__empty">No hay productos registrados.</p>
  }

  return (
    <div className="product-list">
      <table className="product-list__table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Stock total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => {
            const totalStock = product.variants.reduce(
              (sum, v) => sum + v.stockLevel, 0,
            )

            return (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku ?? "—"}</td>
                <td>{formatPriceARS(product.salePrice)}</td>
                <td>{totalStock}</td>
                <td>{product.productStatus}</td>
                <td>
                  <Link href={`/products/${product.id}`} className="btn-link">
                    Ver
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

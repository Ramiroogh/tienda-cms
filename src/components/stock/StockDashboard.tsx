// ─── Descripción ──────────────────────────────────────────────────────────────
// Vista general de stock con todos los productos y sus variantes.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductsAction
// @/lib/utils/currency.utils          → formatPriceARS
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/stock/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getProductsAction } from "@/app/actions/product.actions"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"

export async function StockDashboard() {
  const result = await getProductsAction()

  if (!result.success) {
    return <p className="stock-dashboard__error">Error al cargar stock.</p>
  }

  type StockProduct = { id: string; name: string; variants: Array<{ id: string; size: string | null; color: string | null; stockLevel: number; soldCount: number }> }
  const products = (result.data ?? []) as StockProduct[]

  if (products.length === 0) {
    return <p className="stock-dashboard__empty">No hay productos en el sistema.</p>
  }

  return (
    <div className="stock-dashboard">
      <table className="stock-dashboard__table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Variante</th>
            <th>Stock actual</th>
            <th>Vendidos</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {products.flatMap((product) =>
            product.variants.map((variant) => {
              const isLowStock = variant.stockLevel <= LOW_STOCK_THRESHOLD

              return (
                <tr
                  key={variant.id}
                  className={isLowStock ? "stock-dashboard__row--low" : ""}
                >
                  <td>{product.name}</td>
                  <td>
                    {[variant.size, variant.color].filter(Boolean).join(" / ") || "Única"}
                  </td>
                  <td>{variant.stockLevel}</td>
                  <td>{variant.soldCount}</td>
                  <td>
                    {variant.stockLevel === 0
                      ? "Sin stock"
                      : isLowStock
                        ? "Stock bajo"
                        : "En stock"}
                  </td>
                </tr>
              )
            }),
          )}
        </tbody>
      </table>
    </div>
  )
}

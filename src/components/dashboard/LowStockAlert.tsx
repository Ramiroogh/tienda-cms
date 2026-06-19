// ─── Descripción ──────────────────────────────────────────────────────────────
// Alerta de productos con stock bajo. Muestra los productos que necesitan reposición.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductsAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/dashboard/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getProductsAction } from "@/app/actions/product.actions"

export async function LowStockAlert() {
  const result = await getProductsAction({ lowStock: true })

  if (!result.success || !result.data || (result.data as unknown[]).length === 0) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Stock Bajo</h2>
          <span className="text-2xl font-semibold text-emerald-500">&#10003;</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">No hay productos con stock bajo.</p>
      </section>
    )
  }

  type LowStockProduct = { id: string; name: string; variants: Array<{ size: string | null; stockLevel: number }> }
  const products = result.data as LowStockProduct[]

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Stock Bajo</h2>
        <span className="text-2xl font-semibold text-amber-500">!</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{products.length} producto(s) necesitan reposición</p>
      <ul className="mt-3 space-y-2">
        {products.map((product) => (
          <li key={product.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{product.name}</span>
            <span className="text-xs text-destructive">
              {product.variants
                .filter((v) => v.stockLevel <= 5)
                .map((v) => `${v.size ?? "N/A"}: ${v.stockLevel}`)
                .join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
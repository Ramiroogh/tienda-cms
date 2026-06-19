// ─── Descripción ──────────────────────────────────────────────────────────────
// Widget minimalista con métricas de productos (vendidos, activos, totales).
// Estilo Google: fondo sutil, tipografía limpia, sin bordes ni decoración.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductsAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getProductsAction } from "@/app/actions/product.actions"

type ProductRow = {
  id: string
  variants: Array<{ stockLevel: number; soldCount: number }>
}

export async function MetricsWidget() {
  const [allResult, activeResult] = await Promise.all([
    getProductsAction({}),
    getProductsAction({ onlyActive: true }),
  ])

  const allProducts = (allResult.data ?? []) as ProductRow[]
  const activeProducts = (activeResult.data ?? []) as ProductRow[]

  const totalSold = allProducts.reduce((sum, p) =>
    sum + p.variants.reduce((s, v) => s + v.soldCount, 0), 0
  )

  const totalStock = allProducts.reduce((sum, p) =>
    sum + p.variants.reduce((s, v) => s + v.stockLevel, 0), 0
  )

  const metrics = [
    { label: "Total productos", value: allProducts.length },
    { label: "Activos", value: activeProducts.length },
    { label: "Vendidos", value: totalSold },
    { label: "Stock total", value: totalStock },
  ]

  return (
    <div className="flex items-center gap-8">
      {metrics.map((m) => (
        <div key={m.label} className="text-center">
          <p className="text-xs text-muted-foreground">{m.label}</p>
          <p className="text-lg font-semibold tracking-tight">{m.value}</p>
        </div>
      ))}
    </div>
  )
}
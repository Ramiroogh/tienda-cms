// ─── Descripción ──────────────────────────────────────────────────────────────
// Detalle completo de un producto con variantes, movimientos y acciones.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getProductByIdAction,
//                                       activateProductAction,
//                                       deactivateProductAction
// @/lib/utils/currency.utils          → formatPriceARS
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getProductByIdAction } from "@/app/actions/product.actions"
import { formatPriceARS } from "@/lib/utils/currency.utils"

type ProductDetailProps = {
  productId: string
}

export async function ProductDetail({ productId }: ProductDetailProps) {
  const result = await getProductByIdAction(productId)

  if (!result.success) {
    return <p className="product-detail__error">{result.error}</p>
  }

  type ProductDetailData = {
    name: string; sku: string | null; salePrice: number; productStatus: string; description: string | null
    variants: Array<{ id: string; size: string | null; color: string | null; stockLevel: number; soldCount: number }>
  }
  const product = result.data as ProductDetailData

  return (
    <div className="product-detail">
      <h1 className="product-detail__title">{product.name}</h1>

      <div className="product-detail__info">
        <p><strong>SKU:</strong> {product.sku ?? "—"}</p>
        <p><strong>Precio de venta:</strong> {formatPriceARS(product.salePrice)}</p>
        <p><strong>Estado:</strong> {product.productStatus}</p>
        {product.description && <p><strong>Descripción:</strong> {product.description}</p>}
      </div>

      <section className="product-detail__variants">
        <h2>Variantes</h2>
        <table className="product-detail__table">
          <thead>
            <tr>
              <th>Talla</th>
              <th>Color</th>
              <th>Stock</th>
              <th>Vendidos</th>
            </tr>
          </thead>

          <tbody>
            {product.variants.map((variant) => (
              <tr key={variant.id}>
                <td>{variant.size ?? "—"}</td>
                <td>{variant.color ?? "—"}</td>
                <td>{variant.stockLevel}</td>
                <td>{variant.soldCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de detalle/edición de producto.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/components/products/ProductDetail → ProductDetail
// @/app/actions/product.actions       → getProductByIdAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/page.tsx (link a detalle)
// ──────────────────────────────────────────────────────────────────────────────

import { ProductDetail } from "@/components/products/ProductDetail"

type ProductDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  return (
    <div className="product-detail-page">
      <ProductDetail productId={id} />
    </div>
  )
}

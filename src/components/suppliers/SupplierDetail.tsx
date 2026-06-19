// ─── Descripción ──────────────────────────────────────────────────────────────
// Detalle de proveedor con datos de contacto, historial de órdenes
// y productos vinculados.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions      → getSupplierByIdAction
// @/lib/utils/date.utils              → formatDateShort
// @/components/products/ProductsTable → ProductsTable
// lucide-react                        → Building2, Phone, Mail, MapPin, User,
//                                        FileText
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/suppliers/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getSupplierByIdAction } from "@/app/actions/purchase.actions"
import { formatDateShort } from "@/lib/utils/date.utils"
import { ProductsTable } from "@/components/products/ProductsTable"
import {
  Building2, Phone, Mail, MapPin, User, FileText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type SupplierDetailProps = {
  supplierId: string
}

type PurchaseOrderItem = {
  id: string
  purchaseDate: Date
  totalOrderCost: number | null
}

function sortOrders(orders: PurchaseOrderItem[]): PurchaseOrderItem[] {
  return [...orders].sort((a, b) =>
    new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
  )
}

export async function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const result = await getSupplierByIdAction(supplierId)

  if (!result.success) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {result.error}
      </div>
    )
  }

  type SupplierData = {
    businessName: string
    contactPerson: string | null
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    isActive: boolean
    createdAt: Date
    purchaseOrders: PurchaseOrderItem[]
  }

  const supplier = result.data as SupplierData
  const orders = sortOrders(supplier.purchaseOrders ?? [])

  return (
    <div className="space-y-8">
      {/* ── Info card ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{supplier.businessName}</h2>
              <p className="text-xs text-muted-foreground">
                Registrado el {formatDateShort(supplier.createdAt)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              supplier.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }`}
          >
            {supplier.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <InfoField icon={User} label="Contacto" value={supplier.contactPerson} />
          <InfoField icon={Phone} label="Teléfono" value={supplier.phone} />
          <InfoField icon={Mail} label="Email" value={supplier.email} />
          <InfoField icon={MapPin} label="Dirección" value={supplier.address} />
        </div>

        {supplier.notes && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">{supplier.notes}</p>
          </div>
        )}
      </section>

      {/* ── Orders history ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-medium">Órdenes de Compra</h2>

        <div className="rounded-xl border bg-card">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay órdenes de compra para este proveedor
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Envío</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">{formatDateShort(order.purchaseDate)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {order.totalOrderCost != null && order.totalOrderCost > 0
                            ? `$${order.totalOrderCost.toLocaleString("es-AR")}`
                            : "Sin envío"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {order.totalOrderCost != null
                            ? `$${order.totalOrderCost.toLocaleString("es-AR")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/purchases/${order.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Ver orden
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Linked products ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-medium">Productos Vinculados</h2>
        <ProductsTable supplierId={supplierId} />
      </section>
    </div>
  )
}

// ─── InfoField subcomponent ────────────────────────────────────────────────

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value ?? "—"}</p>
      </div>
    </div>
  )
}
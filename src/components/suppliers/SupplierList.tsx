// ─── Descripción ──────────────────────────────────────────────────────────────
// Listado de proveedores.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/purchase.actions      → getSuppliersAction
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/suppliers/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import { getSuppliersAction } from "@/app/actions/purchase.actions"
import Link from "next/link"

export async function SupplierList() {
  const result = await getSuppliersAction({ onlyActive: true })

  if (!result.success) {
    return <p className="supplier-list__error">Error al cargar proveedores.</p>
  }

  type SupplierRow = { id: string; businessName: string; contactPerson: string | null; phone: string | null; email: string | null }
  const suppliers = (result.data ?? []) as SupplierRow[]

  if (suppliers.length === 0) {
    return <p className="supplier-list__empty">No hay proveedores registrados.</p>
  }

  return (
    <div className="supplier-list">
      <table className="supplier-list__table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.businessName}</td>
              <td>{supplier.contactPerson ?? "—"}</td>
              <td>{supplier.phone ?? "—"}</td>
              <td>{supplier.email ?? "—"}</td>
              <td>
                <Link href={`/suppliers/${supplier.id}`} className="btn-link">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

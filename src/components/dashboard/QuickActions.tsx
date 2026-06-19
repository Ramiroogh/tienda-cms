// ─── Descripción ──────────────────────────────────────────────────────────────
// Accesos rápidos a las acciones principales del sistema.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                        → ShoppingBag, Package, ClipboardList, UserPlus
// next/link                           → Link
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/dashboard/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

import Link from "next/link"
import { ShoppingBag, Package, ClipboardList, UserPlus } from "lucide-react"

const QUICK_ACTIONS = [
  { label: "Registrar Venta", href: "/sales/new", description: "Registrar una nueva venta", icon: ShoppingBag },
  { label: "Nuevo Producto", href: "/products/new", description: "Agregar un producto al catálogo", icon: Package },
  { label: "Nueva Compra", href: "/purchases/new", description: "Registrar compra de mercadería", icon: ClipboardList },
  { label: "Nuevo Proveedor", href: "/suppliers/new", description: "Agregar un proveedor", icon: UserPlus },
] as const

export function QuickActions() {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-medium">Acciones Rápidas</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="mb-3 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium">{action.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
// ─── Descripción ──────────────────────────────────────────────────────────────
// Sidebar de navegación principal. Minimalista con íconos.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                       → LayoutDashboard, Package, ShoppingCart,
//                                      Truck, ClipboardList, Warehouse
// next/link                          → Link
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/layout.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  Warehouse,
} from "lucide-react"

const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Productos", href: "/products", icon: Package },
  { label: "Ventas", href: "/sales", icon: ShoppingCart },
  { label: "Proveedores", href: "/suppliers", icon: Truck },
  { label: "Compras", href: "/purchases", icon: ClipboardList },
  { label: "Stock", href: "/stock", icon: Warehouse },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-5">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Tienda CMS
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive || undefined}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[active]:bg-sidebar-primary data-[active]:text-sidebar-primary-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">CMS v1.0</p>
      </div>
    </aside>
  )
}
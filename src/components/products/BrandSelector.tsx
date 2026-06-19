// ─── Descripción ──────────────────────────────────────────────────────────────
// Selector de marcas con opción de crear nueva inline mediante modal.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → getBrandsAction
// @/components/products/AddItemModal  → AddItemModal
// lucide-react                        → Plus
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { createBrandAction, getBrandsAction } from "@/app/actions/brand.actions"
import { AddItemModal } from "@/components/products/AddItemModal"

type BrandItem = { id: string; name: string }

type BrandSelectorProps = {
  value: string
  onChange: (brand: string) => void
}

export function BrandSelector({ value, onChange }: BrandSelectorProps) {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getBrandsAction().then((r) => r.success && setBrands(r.data as BrandItem[]))
  }, [])

  const handleCreate = async (name: string): Promise<boolean> => {
    const result = await createBrandAction(name)
    if (result.success && result.data) {
      const created = result.data as BrandItem
      setBrands([...brands, created])
      onChange(created.name)
      return true
    }
    if (result.error?.includes("ya existe")) {
      onChange(name)
      return true
    }
    throw new Error(result.error || "Error al crear la marca")
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Marca</label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Sin marca</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>{brand.name}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Plus className="h-3 w-3" />
        Crear nueva marca
      </button>

      <AddItemModal
        isOpen={showModal}
        title="Nueva marca"
        label="Nombre de la marca"
        placeholder="Ej: Nike, Adidas..."
        onSave={handleCreate}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
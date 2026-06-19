// ─── Descripción ──────────────────────────────────────────────────────────────
// Tabla de combinaciones de variantes generadas por producto cartesiano.
// Cada fila permite editar precio, stock y peso individualmente.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                        → AlertTriangle
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useMemo } from "react"
import { AlertTriangle, Paintbrush } from "lucide-react"

type SavedVariant = {
  id: string
  propertyName: string
  propertyValues: string[]
}

type CombinationRow = {
  id: string
  combination: string
  values: string[]
  stock: number
  price: number | null
}

type VariantCombinationsTableProps = {
  savedVariants: SavedVariant[]
  combinations: CombinationRow[]
  onCombinationsChange: (combos: CombinationRow[]) => void
}

function generateProductCartesian(savedVariants: SavedVariant[]): CombinationRow[] {
  if (savedVariants.length === 0) return []

  const result: CombinationRow[] = []

  function recurse(current: string[], idx: number) {
    if (idx >= savedVariants.length) {
      result.push({
        id: `c-${Date.now()}-${result.length}`,
        combination: current.join(" - "),
        values: [...current],
        stock: 0,
        price: null,
      })
      return
    }
    for (const value of savedVariants[idx].propertyValues) {
      recurse([...current, value], idx + 1)
    }
  }

  recurse([], 0)
  return result
}

export function VariantCombinationsTable({
  savedVariants,
  combinations,
  onCombinationsChange,
}: VariantCombinationsTableProps) {
  const generated = useMemo(() => generateProductCartesian(savedVariants), [savedVariants])

  // Merge generated with existing values (preserve user edits by combination key)
  const merged = useMemo(() => {
    return generated.map((gen) => {
      const existing = combinations.find((c) => c.combination === gen.combination)
      return existing ?? gen
    })
  }, [generated, combinations])

  const hasMissingPrices = merged.length > 0 && !merged.some((c) => (c.price ?? 0) > 0)

  const updateCombo = (idx: number, field: "stock" | "price", value: number) => {
    const next = [...merged]
    next[idx] = { ...next[idx], [field]: value }
    onCombinationsChange(next)
  }

  const fillToAll = (idx: number, field: "stock" | "price") => {
    const value = merged[idx][field]
    if (value == null || value === 0) return
    const next = merged.map((row, i) =>
      i === idx ? row : { ...row, [field]: value }
    )
    onCombinationsChange(next)
  }

  const clearRow = (idx: number) => {
    const next = [...merged]
    next[idx] = { ...next[idx], stock: 0, price: null }
    onCombinationsChange(next)
  }

  if (savedVariants.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Combinaciones ({merged.length})
        </h3>
        {hasMissingPrices && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            Asigná al menos un precio
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Variante</th>
              <th className="w-24 px-3 py-2.5 text-right font-medium text-muted-foreground">Stock</th>
              <th className="w-28 px-3 py-2.5 text-right font-medium text-muted-foreground">Precio</th>
              <th className="w-10 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {merged.map((combo, idx) => (
              <tr key={`${combo.id}-${idx}`} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{combo.combination}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-[80px]">
                      <input
                        type="number"
                        min="0"
                        value={combo.stock}
                        onChange={(e) => updateCombo(idx, "stock", Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {combo.stock > 0 && (
                      <button
                        type="button"
                        onClick={() => fillToAll(idx, "stock")}
                        className="shrink-0 text-xs text-muted-foreground hover:text-primary cursor-pointer whitespace-nowrap"
                      >
                        Autocompletar
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-[100px]">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={combo.price ?? ""}
                          onChange={(e) => updateCombo(idx, "price", e.target.value ? parseFloat(e.target.value) : 0)}
                          placeholder="Hereda"
                          className="w-full rounded-md border border-input bg-background py-1 pl-5 pr-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    {(combo.price ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => fillToAll(idx, "price")}
                        className="shrink-0 text-xs text-muted-foreground hover:text-primary cursor-pointer whitespace-nowrap"
                      >
                        Autocompletar
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-1 py-2">
                  {(combo.stock > 0 || (combo.price ?? 0) > 0) && (
                    <button
                      type="button"
                      onClick={() => clearRow(idx)}
                      className="flex items-center justify-center text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Limpiar fila"
                    >
                      <Paintbrush className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMissingPrices && (
        <p className="text-xs text-muted-foreground">
          Las combinaciones sin precio heredarán el precio base del producto.
        </p>
      )}
    </div>
  )
}

export type { SavedVariant, CombinationRow }
"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import type { ProductVariant } from "@/generated/prisma/client"
import { formatPriceARS } from "@/lib/utils/currency.utils"

type VariantInfoModalProps = {
  isOpen: boolean
  productName: string
  variants: ProductVariant[]
  onClose: () => void
}

export function VariantInfoModal({ isOpen, productName, variants, onClose }: VariantInfoModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{productName}</h3>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                <th className="pb-2 pr-2">Variante</th>
                <th className="pb-2 pr-2 text-right">Stock</th>
                <th className="pb-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => {
                const label = [v.size, v.color, v.propertyValue1, v.propertyValue2, v.propertyValue3]
                  .filter(Boolean)
                  .join(" / ") || "Única"
                return (
                  <tr key={v.id || i} className="border-b last:border-0">
                    <td className="py-2.5 pr-2 font-medium">{label}</td>
                    <td className="py-2.5 pr-2 text-right">{v.stockLevel} u.</td>
                    <td className="py-2.5 text-right">
                      {v.price != null ? formatPriceARS(v.price) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

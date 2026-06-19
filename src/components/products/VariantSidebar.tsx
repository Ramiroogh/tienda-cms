// ─── Descripción ──────────────────────────────────────────────────────────────
// Sidebar lateral para configurar propiedades y valores de variantes.
// Soporta drag & drop para reordenar valores, valores sugeridos y personalizados.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                        → X, GripVertical, Plus, ChevronLeft
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, GripVertical, Plus, ChevronLeft } from "lucide-react"

type SavedVariant = {
  id: string
  propertyName: string
  propertyValues: string[]
}

type VariantSidebarProps = {
  isOpen: boolean
  editingVariant: SavedVariant | null
  savedVariants: SavedVariant[]
  onSave: (variant: SavedVariant) => void
  onClose: () => void
}

const PROPERTY_TYPES = ["Talle", "Color", "Tamaño", "Material"] as const

const DEFAULT_OPTIONS: Record<string, string[]> = {
  Talle: ["S", "M", "L", "XL", "2XL", "3XL", "5", "7", "9", "11", "24"],
  Color: ["Negro", "Blanco", "Rojo", "Azul", "Verde", "Gris", "Rosa", "Violeta"],
  Tamaño: [],
  Material: [],
}

function loadPersistedOptions(): Record<string, string[]> {
  if (typeof window === "undefined") return { Talle: [], Color: [], Tamaño: [], Material: [] }
  try {
    const raw = localStorage.getItem("ceci-variant-options")
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { Talle: [], Color: [], Tamaño: [], Material: [] }
}

function persistOptions(type: string, value: string) {
  if (typeof window === "undefined") return
  try {
    const all = loadPersistedOptions()
    if (!all[type]) all[type] = []
    if (!all[type].includes(value)) {
      all[type].push(value)
      localStorage.setItem("ceci-variant-options", JSON.stringify(all))
    }
  } catch { /* ignore */ }
}

function mergeOptions(persisted: Record<string, string[]>, defaults: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const key of Object.keys(defaults)) {
    const p = persisted[key] ?? []
    const d = defaults[key] ?? []
    result[key] = [...new Set([...d, ...p])]
  }
  return result
}

export function VariantSidebar({ isOpen, editingVariant, savedVariants, onSave, onClose }: VariantSidebarProps) {
  const [closing, setClosing] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [variantValues, setVariantValues] = useState<string[]>([])
  const [customInput, setCustomInput] = useState("")
  const [allOptions, setAllOptions] = useState<Record<string, string[]>>({ Talle: [], Color: [], Tamaño: [], Material: [] })
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const persisted = loadPersistedOptions()
    setAllOptions(mergeOptions(persisted, DEFAULT_OPTIONS))
  }, [])

  useEffect(() => {
    if (editingVariant) {
      setSelectedType(editingVariant.propertyName)
      setVariantValues([...editingVariant.propertyValues])
    } else {
      setSelectedType("")
      setVariantValues([])
    }
  }, [editingVariant, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setClosing(false)
      setSelectedType("")
      setVariantValues([])
      setCustomInput("")
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setSelectedType("")
      setVariantValues([])
      setCustomInput("")
      onClose()
    }, 300)
  }, [onClose])

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setVariantValues([])
    setShowDropdown(false)
  }

  const isValueUsedInOtherVariant = useCallback((value: string): boolean => {
    const editingId = editingVariant?.id
    return savedVariants.some(
      (v) => v.propertyName === selectedType && v.id !== editingId && v.propertyValues.includes(value),
    )
  }, [savedVariants, selectedType, editingVariant])

  const handleToggleSuggested = (value: string) => {
    if (isValueUsedInOtherVariant(value)) return
    setVariantValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  const handleAddCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed || variantValues.includes(trimmed) || isValueUsedInOtherVariant(trimmed)) return
    setVariantValues([...variantValues, trimmed])
    persistOptions(selectedType, trimmed)
    const persisted = loadPersistedOptions()
    setAllOptions(mergeOptions(persisted, DEFAULT_OPTIONS))
    setCustomInput("")
  }

  const handleSave = () => {
    if (!selectedType || variantValues.length === 0) return
    const existing = savedVariants.find(
      (v) => v.propertyName === selectedType && v.id !== editingVariant?.id,
    )
    if (existing) {
      const merged = [...new Set([...existing.propertyValues, ...variantValues])]
      onSave({ ...existing, propertyValues: merged })
    } else {
      onSave({
        id: editingVariant?.id ?? `v-${Date.now()}`,
        propertyName: selectedType,
        propertyValues: variantValues,
      })
    }
    handleClose()
  }

  // Drag & Drop
  const handleDragStart = (idx: number) => setDraggedIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx) return
    const next = [...variantValues]
    const [moved] = next.splice(draggedIdx, 1)
    next.splice(idx, 0, moved)
    setVariantValues(next)
    setDraggedIdx(idx)
  }
  const handleDragEnd = () => setDraggedIdx(null)

  if (!isOpen && !closing) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        style={{ opacity: closing ? 0 : 1 }}
        onClick={handleClose}
      />
      <div
        className="relative flex h-full w-full max-w-md flex-col bg-background shadow-xl transition-transform duration-300"
        style={{ transform: closing ? "translateX(100%)" : "translateX(0)" }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {editingVariant ? "Editar variante" : "Nueva propiedad"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Property selector ─────────────────────────────────────── */}
          <div className="mb-6 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Propiedad</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                <span className={selectedType ? "" : "text-muted-foreground"}>
                  {selectedType || "Seleccioná una propiedad"}
                </span>
                <ChevronLeft className={`h-4 w-4 transition-transform ${showDropdown ? "-rotate-90" : "rotate-0"}`} />
              </button>
              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeSelect(type)}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent ${selectedType === type ? "bg-accent font-medium" : ""}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Selected values (with drag & drop) ────────────────────── */}
          {selectedType && (
            <div className="mb-6 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Valores seleccionados</label>
              {variantValues.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Seleccioná valores de la lista de abajo
                </p>
              ) : (
                <div className="space-y-1">
                  {variantValues.map((value, idx) => (
                    <div
                      key={value}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-opacity ${draggedIdx === idx ? "opacity-50" : ""}`}
                    >
                      <div className="cursor-grab text-muted-foreground">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="3" cy="2" r="1.2" fill="currentColor"/>
                          <circle cx="9" cy="2" r="1.2" fill="currentColor"/>
                          <circle cx="3" cy="6" r="1.2" fill="currentColor"/>
                          <circle cx="9" cy="6" r="1.2" fill="currentColor"/>
                          <circle cx="3" cy="10" r="1.2" fill="currentColor"/>
                          <circle cx="9" cy="10" r="1.2" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="flex-1">{value}</span>
                      <button
                        type="button"
                        onClick={() => setVariantValues(variantValues.filter((v) => v !== value))}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Custom value input ─────────────────────────────────────── */}
          {selectedType && (
            <div className="mb-6 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Agregar valor personalizado</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
                  placeholder="Escribí un valor..."
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!customInput.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-accent disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Suggested values ───────────────────────────────────────── */}
          {selectedType && allOptions[selectedType] && allOptions[selectedType].length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Valores sugeridos</label>
              <div className="flex flex-wrap gap-2">
                {allOptions[selectedType].map((value) => {
                  const isUsed = isValueUsedInOtherVariant(value)
                  const isSelected = variantValues.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isUsed}
                      onClick={() => handleToggleSuggested(value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        isUsed
                          ? "cursor-not-allowed border-border text-muted-foreground/50 line-through"
                          : isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                          <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {value}
                      {isUsed && " (ya agregado)"}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="border-t px-4 py-3">
          <button
            type="button"
            disabled={!selectedType || variantValues.length === 0}
            onClick={handleSave}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {editingVariant
              ? `Guardar cambios (${variantValues.length} valor${variantValues.length !== 1 ? "es" : ""})`
              : `Crear (${variantValues.length} valor${variantValues.length !== 1 ? "es" : ""})`}
          </button>
        </div>
      </div>
    </div>
  )
}
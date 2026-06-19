// ─── Descripción ──────────────────────────────────────────────────────────────
// Formulario de creación de producto en 3 pasos con variantes.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/app/actions/product.actions       → createProductAction, getBrandsAction
// @/components/products/ImageUploader → ImageUploader, ImageItem
// @/components/products/VariantSidebar  → VariantSidebar, SavedVariant
// @/components/products/VariantCombinationsTable  → VariantCombinationsTable, CombinationRow
// @/components/products/CategorySelector  → CategorySelector
// @/components/products/BrandSelector  → BrandSelector
// @/components/products/UnsavedChangesModal → UnsavedChangesModal
// lucide-react                        → Plus, X, Tag, Link, Check, ChevronRight
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/new/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Tag, Link as LinkIcon, Check, ChevronRight } from "lucide-react"
import { createProductAction } from "@/app/actions/product.actions"
import { ImageUploader } from "@/components/products/ImageUploader"
import { VariantSidebar } from "@/components/products/VariantSidebar"
import { VariantCombinationsTable } from "@/components/products/VariantCombinationsTable"
import { CategorySelector } from "@/components/products/CategorySelector"
import { BrandSelector } from "@/components/products/BrandSelector"
import { UnsavedChangesModal } from "@/components/products/UnsavedChangesModal"
import type { ImageItem } from "@/components/products/ImageUploader"
import type { SavedVariant, CombinationRow } from "@/components/products/VariantCombinationsTable"

type CategoryItem = { id: string; name: string }

const STEPS = [
  { label: "Información", key: "info" },
  { label: "Configuración", key: "config" },
  { label: "Revisión", key: "review" },
] as const

const DRAFT_KEY = "ceci-product-draft"

export function ProductForm() {
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categoryName, setCategoryName] = useState("")
  const [brand, setBrand] = useState("")
  const [images, setImages] = useState<ImageItem[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [tagsInput, setTagsInput] = useState("")
  const [linksInput, setLinksInput] = useState("")

  // ── Step 1 — Variant state ────────────────────────────────────────────────
  const [savedVariants, setSavedVariants] = useState<SavedVariant[]>([])
  const [showVariantSidebar, setShowVariantSidebar] = useState(false)
  const [editingVariant, setEditingVariant] = useState<SavedVariant | null>(null)

  // ── Step 2 — Combinations state ───────────────────────────────────────────
  const [combinations, setCombinations] = useState<CombinationRow[]>([])
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [costPrice, setCostPrice] = useState<number | null>(null)
  const [stock, setStock] = useState(0)

  // ── Persistence ─────────────────────────────────────────────────────────
  const [hasChanges, setHasChanges] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const pendingNavigation = useRef<(() => void) | null>(null)
  const ignorePopstateRef = useRef(false)

  // ── Refs ──────────────────────────────────────────────────────────────────

  // ── Mark dirty on any change ───────────────────────────────────────────────
  const markChanged = useCallback(() => {
    if (!hasChanges) setHasChanges(true)
  }, [hasChanges])

  // ── Save / restore draft ───────────────────────────────────────────────────
  const saveDraft = useCallback(() => {
    const draft = {
      name,
      description,
      brand,
      categoryId,
      tags,
      links,
      basePrice,
      costPrice,
      stock,
      savedVariants,
      combinations,
      currentStep,
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch { /* quota exceeded */ }
  }, [name, description, brand, categoryId, tags, links, basePrice, costPrice, stock, savedVariants, combinations, currentStep])

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
  }

  // ── Load draft on mount ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      setName(draft.name ?? "")
      setDescription(draft.description ?? "")
      if (draft.brand) setBrand(draft.brand)
      if (draft.categoryId) setCategoryId(draft.categoryId)
      if (draft.tags) setTags(draft.tags)
      if (draft.links) setLinks(draft.links)
      if (draft.basePrice != null) setBasePrice(draft.basePrice)
      if (draft.costPrice != null) setCostPrice(draft.costPrice)
      if (draft.stock != null) setStock(draft.stock)
      if (draft.savedVariants) setSavedVariants(draft.savedVariants)
      if (draft.combinations) setCombinations(draft.combinations)
      if (draft.currentStep != null) setCurrentStep(draft.currentStep)
    } catch { /* ignore */ }
  }, [])

  // ── Auto-save draft every 10s when there are changes ───────────────────────
  useEffect(() => {
    if (!hasChanges) return
    const interval = setInterval(saveDraft, 10_000)
    return () => clearInterval(interval)
  }, [hasChanges, saveDraft])

  // ── beforeunload (tab close / refresh) ──────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasChanges])

  // ── Navigation guards (popstate + link interceptor) ──────────────────────
  useEffect(() => {
    if (!hasChanges) return

    const handlePopState = () => {
      if (ignorePopstateRef.current) {
        ignorePopstateRef.current = false
        return
      }
      if (!showUnsavedModal) {
        setShowUnsavedModal(true)
        pendingNavigation.current = null
        window.history.pushState(null, "")
      }
    }

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a")
      if (!link) return
      const href = link.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return
      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      setShowUnsavedModal(true)
      pendingNavigation.current = () => { window.location.href = href }
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener("popstate", handlePopState)
    document.addEventListener("click", handleClick, true)

    return () => {
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("click", handleClick, true)
    }
  }, [hasChanges, showUnsavedModal])

  // ── Step navigation ────────────────────────────────────────────────────────
  const goToStep = (step: number) => {
    setError(null)
    saveDraft()
    setCurrentStep(step)
  }

  const canGoNextStep1 = () => {
    return name.trim().length >= 2
  }

  const canGoNextStep2 = () => {
    if (savedVariants.length > 0) {
      return (basePrice ?? 0) > 0 || combinations.some((c) => (c.price ?? 0) > 0)
    }
    return (basePrice ?? 0) > 0
  }

  // ── Handle Cancel with unsaved check ────────────────────────────────────────
  const handleCancel = () => {
    if (hasChanges) {
      pendingNavigation.current = null
      setShowUnsavedModal(true)
    } else {
      clearDraft()
      router.back()
    }
  }

  const handleDiscardDraft = () => {
    clearDraft()
    setHasChanges(false)
    setShowUnsavedModal(false)
    if (pendingNavigation.current) {
      const nav = pendingNavigation.current
      pendingNavigation.current = null
      nav()
    } else {
      ignorePopstateRef.current = true
      window.history.back()
    }
  }

  const handleSaveDraft = () => {
    saveDraft()
    setShowUnsavedModal(false)
    if (pendingNavigation.current) {
      const nav = pendingNavigation.current
      pendingNavigation.current = null
      nav()
    } else {
      ignorePopstateRef.current = true
      window.history.back()
    }
  }

  // ── Variant handlers ────────────────────────────────────────────────────────
  const handleOpenVariantSidebar = (variant?: SavedVariant) => {
    setEditingVariant(variant ?? null)
    setShowVariantSidebar(true)
  }

  const handleVariantSave = (variant: SavedVariant) => {
    const existingIdx = savedVariants.findIndex((v) => v.id === variant.id)
    if (existingIdx >= 0) {
      const next = [...savedVariants]
      next[existingIdx] = variant
      setSavedVariants(next)
    } else {
      // Merge if same propertyName exists
      const sameProp = savedVariants.findIndex((v) => v.propertyName === variant.propertyName)
      if (sameProp >= 0) {
        const next = [...savedVariants]
        const merged = [...new Set([...next[sameProp].propertyValues, ...variant.propertyValues])]
        next[sameProp] = { ...next[sameProp], propertyValues: merged }
        setSavedVariants(next)
      } else {
        setSavedVariants([...savedVariants, variant])
      }
    }
    setShowVariantSidebar(false)
    setEditingVariant(null)
  }

  const handleRemoveVariant = (id: string) => {
    setSavedVariants(savedVariants.filter((v) => v.id !== id))
    setCombinations([])
  }

  const handleRemoveVariantValue = (variantId: string, value: string) => {
    setSavedVariants(
      savedVariants.map((v) => {
        if (v.id !== variantId) return v
        const filtered = v.propertyValues.filter((pv) => pv !== value)
        if (filtered.length === 0) return null
        return { ...v, propertyValues: filtered }
      }).filter(Boolean) as SavedVariant[],
    )
    setCombinations([])
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null)
    setIsPending(true)

    try {
      const formData = new FormData()
      formData.set("name", name)
      if (description) formData.set("description", description)
      if (brand) formData.set("brand", brand)
      if (categoryId) formData.set("categoryId", categoryId)
      formData.set("tags", JSON.stringify(tags))
      formData.set("referenceLinks", JSON.stringify(links))
      formData.set("imageUrls", JSON.stringify(images.map((i) => i.uploadedUrl || i.previewUrl)))

      if (savedVariants.length > 0) {
        const hasBasePrice = (basePrice ?? 0) > 0
        formData.set("salePrice", String(basePrice ?? 0))
        if (hasBasePrice && costPrice) formData.set("costPrice", String(costPrice))

        // Adapt variants and combinations to backend format
        type FlatVariant = {
          size: string | null
          color: string | null
          propertyName1?: string
          propertyValue1?: string
          propertyName2?: string
          propertyValue2?: string
          propertyName3?: string
          propertyValue3?: string
          stockLevel: number
          price?: number
        }

        const flatVariants: FlatVariant[] = combinations.map((combo) => {
          const flat: FlatVariant = {
            size: combo.values[0] ?? null,
            color: combo.values[1] ?? null,
            stockLevel: combo.stock,
            price: combo.price ?? undefined,
          }

savedVariants.forEach((v, idx) => {
              const key = idx + 1
              if (key <= 3) {
                const prop = `propertyName${key}`
                const val = `propertyValue${key}`
                ;(flat as any)[prop] = v.propertyName
                ;(flat as any)[val] = combo.values[idx] ?? null
              }
            })

          return flat
        })

        formData.set("variants", JSON.stringify(flatVariants))
        formData.set("hasVariants", "true")
      } else {
        formData.set("salePrice", String(basePrice ?? 0))
        if (costPrice) formData.set("costPrice", String(costPrice))
        formData.set("stock", String(stock))
        formData.set("variants", JSON.stringify([{ size: null, color: null }]))
        formData.set("hasVariants", "false")
      }

      const result = await createProductAction(formData)
      if (result.success) {
        clearDraft()
        router.push("/products?success=1")
      } else {
        setError(result.error ?? "Error al crear el producto")
      }
    } catch {
      setError("Error inesperado al crear el producto")
    } finally {
      setIsPending(false)
    }
  }

  // ── Progress bar ────────────────────────────────────────────────────────────
  function ProgressBar() {
    return (
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep
          const isActive = idx === currentStep
          const isLast = idx === STEPS.length - 1
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors
                    ${isCompleted ? "bg-primary text-primary-foreground" : ""}
                    ${isActive ? "border-2 border-primary bg-background text-primary" : ""}
                    ${!isCompleted && !isActive ? "border border-muted-foreground/30 text-muted-foreground" : ""}
                  `}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-foreground" : isCompleted ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-3 h-px flex-1 ${
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Progress Bar ──────────────────────────────────────────────────── */}
      <ProgressBar />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Información básica + Variantes                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentStep === 0 && (
        <div className="space-y-8">
          {/* ── Basic info ───────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-base font-medium">Información del producto</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre del producto <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => { setName(e.target.value); markChanged() }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ej: Vestido estampado floral"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markChanged() }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Breve descripción del producto..."
                />
              </div>
              <div className="space-y-0">
                <BrandSelector value={brand} onChange={(v) => { setBrand(v); markChanged() }} />
              </div>
              <div className="space-y-0">
                <CategorySelector value={categoryId} onChange={(v, n) => { setCategoryId(v); setCategoryName(n ?? ""); markChanged() }} />
              </div>
            </div>
          </section>

          {/* ── Variants ─────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Variantes del producto</h2>
              <button
                type="button"
                onClick={() => handleOpenVariantSidebar()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar variantes
              </button>
            </div>

            {savedVariants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sin variantes configuradas. El producto será simple (sin talla/color).
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedVariants.map((v) => (
                  <div
                    key={v.id}
                    className="group relative rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{v.propertyName}</span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleOpenVariantSidebar(v)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-destructive hover:bg-destructive/10"
                        >
                          X
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {v.propertyValues.map((val) => (
                        <span
                          key={val}
                          className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
                        >
                          {val}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantValue(v.id, val)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Tags ──────────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">Etiquetas</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (() => { const t = tagsInput.trim(); if (t && !tags.includes(t)) { setTags([...tags, t]); setTagsInput("") } })())}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Escribí una etiqueta y presioná Enter"
              />
              <button type="button" onClick={() => { const t = tagsInput.trim(); if (t && !tags.includes(t)) { setTags([...tags, t]); setTagsInput("") } }} className="rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent">
                <Tag className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── Reference links ───────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="text-base font-medium">Enlaces de referencia</h2>
            <div className="flex gap-2">
              <input
                type="url"
                value={linksInput}
                onChange={(e) => setLinksInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (() => { const l = linksInput.trim(); if (l && !links.includes(l)) { setLinks([...links, l]); setLinksInput("") } })())}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://ejemplo.com/producto"
              />
              <button type="button" onClick={() => { const l = linksInput.trim(); if (l && !links.includes(l)) { setLinks([...links, l]); setLinksInput("") } }} className="rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent">
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>
            {links.length > 0 && (
              <div className="space-y-1">
                {links.map((link) => (
                  <div key={link} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                    <span className="truncate text-xs text-muted-foreground">{link}</span>
                    <button type="button" onClick={() => setLinks(links.filter((l) => l !== link))} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Images ────────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <ImageUploader images={images} onImagesChange={setImages} />
          </section>

          {/* ── Step 1 actions ────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canGoNextStep1()}
              onClick={() => goToStep(1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Configuración (precios / combinaciones)                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-8">
          {savedVariants.length > 0 ? (
            <>
              <section className="space-y-4">
                <h2 className="text-base font-medium">Resumen de variantes</h2>
                <div className="flex flex-wrap gap-2">
                  {savedVariants.map((v) => (
                    <div
                      key={v.id}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs"
                    >
                      <span className="font-medium text-muted-foreground">{v.propertyName}:</span>
                      {v.propertyValues.map((val) => (
                        <span key={val} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                          {val}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantValue(v.id, val)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleOpenVariantSidebar()}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-3 py-1 text-xs text-primary hover:bg-primary/5"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-medium">Precios</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio de costo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costPrice ?? ""}
                        onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio de venta (herencia)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={basePrice ?? ""}
                        onChange={(e) => setBasePrice(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Las combinaciones sin precio heredarán este valor</p>
                  </div>
                </div>
              </section>

              <section>
                <VariantCombinationsTable
                  savedVariants={savedVariants}
                  combinations={combinations}
                  onCombinationsChange={setCombinations}
                />
              </section>
            </>
          ) : (
            <section className="space-y-4">
              <h2 className="text-base font-medium">Precios</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio de costo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice ?? ""}
                      onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Precio de venta <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={basePrice ?? ""}
                      onChange={(e) => setBasePrice(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                  />
                </div>
              </div>
            </section>
          )}

          {!canGoNextStep2() && (
            <p className="text-xs text-amber-600">
              {savedVariants.length > 0
                ? "Asigná al menos un precio a una combinación para continuar."
                : "Ingresá un precio de venta para continuar."}
            </p>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => goToStep(0)}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!canGoNextStep2()}
              onClick={() => goToStep(2)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — Revisión y confirmación                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-8">
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 text-sm font-medium">Resumen del producto</h3>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground">Nombre</span>
                <p className="font-medium">{name}</p>
              </div>
              {description && (
                <div>
                  <span className="text-xs text-muted-foreground">Descripción</span>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              )}
              {brand && (
                <div>
                  <span className="text-xs text-muted-foreground">Marca</span>
                  <p>{brand}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">Categoría</span>
                <p>{categoryName || "Sin categoría"}</p>
              </div>
            </div>
          </section>

          {tags.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h3 className="mb-2 text-sm font-medium">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="rounded-full border px-2.5 py-0.5 text-xs">{t}</span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 text-sm font-medium">Precios</h3>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                  <span className="text-xs text-muted-foreground">Precio de venta</span>
                <p className="font-medium">${(basePrice ?? 0).toFixed(2)}</p>
              </div>
              {costPrice && (
                <div>
                  <span className="text-xs text-muted-foreground">Precio de costo</span>
                  <p>${costPrice.toFixed(2)}</p>
                </div>
              )}
            </div>
          </section>

          {savedVariants.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Variantes</h3>
                <span className="rounded-full border px-2.5 py-0.5 text-xs">{combinations.length} combinaciones</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {savedVariants.map((v) => (
                  <div key={v.id} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{v.propertyName}:</span>{" "}
                    {v.propertyValues.join(", ")}
                  </div>
                ))}
              </div>

              {combinations.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Combinación</th>
                        <th className="w-16 px-3 py-2 text-right font-medium text-muted-foreground">Stock</th>
                        <th className="w-20 px-3 py-2 text-right font-medium text-muted-foreground">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinations.slice(0, 11).map((c, i) => (
                        <tr key={`${c.id}-${i}`} className="border-b last:border-0">
                          <td className="px-3 py-1.5 text-xs">{c.combination}</td>
                          <td className="px-3 py-1.5 text-right text-xs">{c.stock}</td>
                          <td className="px-3 py-1.5 text-right text-xs">${(c.price ?? basePrice ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {images.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h3 className="mb-2 text-sm font-medium">Imágenes ({images.length})</h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {images.map((img) => (
                  <div key={img.id} className="aspect-square overflow-hidden rounded-lg border bg-muted">
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Financial Summary ──────────────────────────────────────────── */}
          {(() => {
            const productTotalCost = savedVariants.length > 0
              ? combinations.reduce((sum, c) => sum + (costPrice ?? 0) * c.stock, 0)
              : (costPrice ?? 0) * stock

            const productTotalSale = savedVariants.length > 0
              ? combinations.reduce((sum, c) => sum + (c.price ?? basePrice ?? 0) * c.stock, 0)
              : (basePrice ?? 0) * stock

            const productProfit = productTotalSale - productTotalCost

            return (
              <div className="rounded-xl border bg-card">
                <div className="border-b px-5 py-3">
                  <h3 className="text-sm font-semibold">Resumen financiero</h3>
                </div>
                <div className="grid grid-cols-3 divide-x">
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Total Costo
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      ${productTotalCost.toFixed(2)}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Subtotal
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-sky-700">
                      ${productTotalSale.toFixed(2)}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Ganancia Real
                    </p>
                    <p
                      className={`mt-1 text-lg font-semibold tabular-nums ${
                        productProfit >= 0 ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {productProfit >= 0 ? "+" : ""}${productProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Confirmar y guardar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Variant sidebar (global overlay) ──────────────────────────────── */}
      <VariantSidebar
        isOpen={showVariantSidebar}
        editingVariant={editingVariant}
        savedVariants={savedVariants}
        onSave={handleVariantSave}
        onClose={() => { setShowVariantSidebar(false); setEditingVariant(null) }}
      />

      {/* ── Unsaved changes modal ───────────────────────────────────────── */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleSaveDraft}
        onDiscard={handleDiscardDraft}
        onClose={() => setShowUnsavedModal(false)}
      />
    </div>
  )
}
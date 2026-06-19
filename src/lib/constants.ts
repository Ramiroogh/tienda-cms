// ─── Descripción ──────────────────────────────────────────────────────────────
// Constantes globales del dominio. Umbrales, límites y valores por defecto.
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/services/stock.service.ts
// lib/services/product.service.ts
// lib/utils/*
// ──────────────────────────────────────────────────────────────────────────────

export const LOW_STOCK_THRESHOLD = 5

export const MAX_PRODUCT_IMAGES = 6

export const R2_IMAGES_FOLDER = "productos"

export const DEFAULT_SALE_CHANNEL = "PRESENCIAL" as const

export const MANUAL_ADJUSTMENT_MIN_NOTE_LENGTH = 10

export const DEFAULT_PAGE_SIZE = 20

export const STOCK_STATUS_LABELS = {
  IN_STOCK: "En stock",
  LOW_STOCK: "Stock bajo",
  OUT_OF_STOCK: "Sin stock",
} as const

export const PRODUCT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
] as const

export const PRODUCT_STATUS_BADGE = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  ACTIVE: { label: "Activo", variant: "default" },
  INACTIVE: { label: "Inactivo", variant: "outline" },
} as const

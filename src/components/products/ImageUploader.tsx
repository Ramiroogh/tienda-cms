// ─── Descripción ──────────────────────────────────────────────────────────────
// Subidor de imágenes con drag-and-drop, reordenamiento y eliminación.
// Máximo 6 imágenes. Soporta: JPEG, PNG, WebP, AVIF.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// lucide-react                        → Upload, GripVertical, X, Image
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// components/products/ProductForm.tsx
// ──────────────────────────────────────────────────────────────────────────────

"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, GripVertical, Image as ImageIcon } from "lucide-react"

type ImageItem = {
  id: string
  file: File
  previewUrl: string
  uploadedUrl?: string
  isUploading: boolean
}

type ImageUploaderProps = {
  images: ImageItem[]
  onImagesChange: (images: ImageItem[]) => void
  maxImages?: number
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]
const MAX_SIZE = 10 * 1024 * 1024

export function ImageUploader({ images, onImagesChange, maxImages = 6 }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragItemIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateAndAddFiles = useCallback((files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)
    const remaining = maxImages - images.length

    if (fileArray.length > remaining) {
      setError(`Solo podés agregar ${remaining} imagen(es) más (máx. ${maxImages})`)
      return
    }

    const invalidType = fileArray.find((f) => !ALLOWED_TYPES.includes(f.type))
    if (invalidType) {
      setError(`Formato no soportado: ${invalidType.type}. Permitidos: JPEG, PNG, WebP, AVIF`)
      return
    }

    const oversized = fileArray.find((f) => f.size > MAX_SIZE)
    if (oversized) {
      setError(`El archivo "${oversized.name}" supera los 10 MB`)
      return
    }

    const newItems: ImageItem[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      isUploading: false,
    }))

    onImagesChange([...images, ...newItems])
  }, [images, maxImages, onImagesChange])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files)
      e.target.value = ""
    }
  }

  const handleRemove = (id: string) => {
    const item = images.find((i) => i.id === id)
    if (item) URL.revokeObjectURL(item.previewUrl)
    onImagesChange(images.filter((i) => i.id !== id))
  }

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverIndex.current = index
  }

  const handleDragEnd = () => {
    if (dragItemIndex.current !== null && dragOverIndex.current !== null && dragItemIndex.current !== dragOverIndex.current) {
      const reordered = [...images]
      const [moved] = reordered.splice(dragItemIndex.current, 1)
      reordered.splice(dragOverIndex.current, 0, moved)
      onImagesChange(reordered)
    }
    dragItemIndex.current = null
    dragOverIndex.current = null
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Imágenes</label>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click() }}
        data-active={isDragOver || undefined}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:bg-accent/50 data-[active]:border-primary data-[active]:bg-primary/5"
      >
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragOver ? "Soltá las imágenes aquí" : "Arrastrá imágenes o hacé clic para seleccionar"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP, AVIF — Máx. 10 MB c/u — Hasta {maxImages} imágenes
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.avif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {images.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={item.previewUrl}
                alt={`Imagen ${index + 1}`}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="absolute left-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>

              {item.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}

              <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Empty slot */}
          {Array.from({ length: Math.min(maxImages - images.length, 0 > 0 ? 0 : 1) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-muted/30"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export type { ImageItem }
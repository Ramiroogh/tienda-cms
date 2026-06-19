// ─── Descripción ──────────────────────────────────────────────────────────────
// Página de prueba para subir imágenes a Cloudflare R2 vía proxy server-side.
// Útil para verificar que R2 está configurado correctamente.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// next/navigation                    → (ninguna, página standalone)
//
// ─── Uso ──────────────────────────────────────────────────────────────────────
// http://localhost:3000/test-upload
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

"use client"

import { useState, useRef, type ChangeEvent, type FormEvent } from "react"

// ─── Constantes ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"]
const MAX_FILES = 6
const MAX_SIZE_MB = 10

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UploadResult = {
  fileName: string
  status: "uploading" | "success" | "error"
  publicUrl?: string
  errorMessage?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestUploadPage() {
  // ── State ───────────────────────────────────────────────────────────────────
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [results, setResults] = useState<UploadResult[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGlobalError(null)
    setResults([])

    const files = Array.from(event.target.files ?? [])

    if (files.length > MAX_FILES) {
      setGlobalError(`Máximo ${MAX_FILES} archivos. Seleccionaste ${files.length}.`)
      return
    }

    const invalidFile = files.find((file) => !ALLOWED_TYPES.includes(file.type))
    if (invalidFile) {
      setGlobalError(
        `Tipo no soportado: "${invalidFile.name}" (${invalidFile.type}). Permitidos: PNG, JPG, WebP, AVIF.`,
      )
      return
    }

    const oversizedFile = files.find((file) => file.size > MAX_SIZE_MB * 1024 * 1024)
    if (oversizedFile) {
      setGlobalError(
        `"${oversizedFile.name}" excede el máximo de ${MAX_SIZE_MB} MB.`,
      )
      return
    }

    setSelectedFiles(files)
  }

  const handleUploadAll = async (event: FormEvent) => {
    event.preventDefault()
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setGlobalError(null)

    const uploadResults: UploadResult[] = selectedFiles.map((file) => ({
      fileName: file.name,
      status: "uploading" as const,
    }))
    setResults(uploadResults)

    for (let index = 0; index < selectedFiles.length; index++) {
      const file = selectedFiles[index]

      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("currentImageCount", String(index))

        const proxyResponse = await fetch("/api/upload/proxy", {
          method: "POST",
          body: uploadFormData,
        })

        const proxyData = await proxyResponse.json()

        if (!proxyData.success) {
          updateResult(index, {
            status: "error",
            errorMessage: proxyData.error ?? "Error en la subida",
          })
          continue
        }

        updateResult(index, {
          status: "success",
          publicUrl: proxyData.data.publicUrl,
        })
      } catch (error) {
        updateResult(index, {
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    setIsUploading(false)
  }

  const updateResult = (
    index: number,
    partial: Partial<UploadResult>,
  ) => {
    setResults((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...partial }
      return next
    })
  }

  const handleReset = () => {
    setSelectedFiles([])
    setResults([])
    setGlobalError(null)
    if (formRef.current) formRef.current.reset()
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const pendingCount = selectedFiles.length
  const successCount = results.filter((r) => r.status === "success").length
  const errorCount = results.filter((r) => r.status === "error").length
  const allDone = !isUploading && results.length > 0

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        🖼️ Prueba de subida a Cloudflare R2
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Seleccioná hasta {MAX_FILES} imágenes (PNG, JPG, WebP, AVIF, máx{" "}
        {MAX_SIZE_MB} MB c/u) y subilas directamente a R2.
      </p>

      {/* ── Formulario ──────────────────────────────────────────────────── */}
      <form ref={formRef} onSubmit={handleUploadAll}>
        <div
          style={{
            border: "2px dashed #ccc",
            borderRadius: 8,
            padding: "2rem",
            textAlign: "center",
            marginBottom: "1rem",
          }}
        >
          <input
            type="file"
            name="files"
            multiple
            accept=".png,.jpg,.jpeg,.webp,.avif"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ marginBottom: "0.5rem" }}
          />
          <p style={{ fontSize: "0.875rem", color: "#999" }}>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} archivo(s) seleccionado(s)`
              : "Arrastrá o seleccioná archivos"}
          </p>
        </div>

        {globalError && (
          <p
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              padding: "0.5rem 1rem",
              borderRadius: 6,
              marginBottom: "1rem",
            }}
          >
            {globalError}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            disabled={selectedFiles.length === 0 || isUploading}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: isUploading ? "#999" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading
              ? `Subiendo ${successCount + 1}/${pendingCount}...`
              : `Subir ${pendingCount} archivo(s)`}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isUploading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Limpiar
          </button>
        </div>
      </form>

      {/* ── Resultados ──────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Resultados
            {allDone && (
              <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "#666", marginLeft: "0.5rem" }}>
                ({successCount} OK
                {errorCount > 0 ? `, ${errorCount} error(es)` : ""})
              </span>
            )}
          </h2>

          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {results.map((result, index) => (
              <li
                key={index}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor:
                    result.status === "success"
                      ? "#bbf7d0"
                      : result.status === "error"
                        ? "#fecaca"
                        : "#e5e7eb",
                  background:
                    result.status === "success"
                      ? "#f0fdf4"
                      : result.status === "error"
                        ? "#fef2f2"
                        : "#fafafa",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
                  {result.fileName}
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                    {result.status === "uploading" && "⏳ Subiendo..."}
                    {result.status === "success" && "✅ Subida"}
                    {result.status === "error" && "❌ Error"}
                  </span>
                </div>

                {result.publicUrl && (
                  <div style={{ fontSize: "0.8rem", color: "#2563eb" }}>
                    <a href={result.publicUrl} target="_blank" rel="noopener noreferrer">
                      {result.publicUrl}
                    </a>
                  </div>
                )}

                {result.errorMessage && (
                  <p style={{ fontSize: "0.8rem", color: "#b91c1c", margin: "0.25rem 0 0" }}>
                    {result.errorMessage}
                  </p>
                )}

                {result.publicUrl && (
                  <img
                    src={result.publicUrl}
                    alt={result.fileName}
                    style={{
                      marginTop: "0.5rem",
                      maxWidth: 200,
                      maxHeight: 150,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

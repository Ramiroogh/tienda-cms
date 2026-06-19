// ─── Descripción ──────────────────────────────────────────────────────────────
// Endpoint que genera una presigned URL de upload para Cloudflare R2.
// El cliente sube el archivo directamente a R2 usando esta URL firmada.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/utils/r2.utils               → getPresignedUploadUrl, validateImageUpload
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// Frontend: componentes de formulario de producto
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl, validateImageUpload } from "@/lib/utils/r2.utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type R2PresignedRequestBody = {
  fileName: string
  contentType: string
  fileSize: number
  productId?: string
  currentImageCount?: number
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: R2PresignedRequestBody = await request.json()

    const { fileName, contentType, fileSize, productId, currentImageCount = 0 } = body

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "El nombre del archivo es requerido." },
        { status: 400 },
      )
    }

    if (!contentType) {
      return NextResponse.json(
        { success: false, error: "El tipo de contenido es requerido." },
        { status: 400 },
      )
    }

    const validation = validateImageUpload(contentType, fileSize, currentImageCount)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    const result = await getPresignedUploadUrl(fileName, contentType, productId)

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        fileKey: result.fileKey,
      },
    })
  } catch (error) {
    console.error("Error generando presigned URL:", error)
    return NextResponse.json(
      { success: false, error: "Error al generar la URL de carga." },
      { status: 500 },
    )
  }
}

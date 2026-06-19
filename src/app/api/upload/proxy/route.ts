// ─── Descripción ──────────────────────────────────────────────────────────────
// Endpoint proxy que recibe un archivo del cliente y lo sube a Cloudflare R2
// desde el servidor. Evita problemas de CORS del browser → R2 directo.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/lib/utils/r2.utils               → uploadFileToR2, validateImageUpload
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// Frontend: test-upload page y futuros formularios de producto
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server"
import { uploadFileToR2, validateImageUpload } from "@/lib/utils/r2.utils"

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const productId = formData.get("productId") as string | null
    const currentImageCount = Number(formData.get("currentImageCount") ?? 0)

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se envió ningún archivo." },
        { status: 400 },
      )
    }

    const validation = validateImageUpload(
      file.type,
      file.size,
      currentImageCount,
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadFileToR2(
      fileBuffer,
      file.name,
      file.type,
      productId ?? undefined,
    )

    return NextResponse.json({
      success: true,
      data: {
        publicUrl: result.publicUrl,
        fileKey: result.fileKey,
      },
    })
  } catch (error) {
    console.error("Error en upload proxy:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir el archivo." },
      { status: 500 },
    )
  }
}

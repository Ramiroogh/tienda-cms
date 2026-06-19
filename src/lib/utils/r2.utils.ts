// ─── Descripción ──────────────────────────────────────────────────────────────
// Utilidades para Cloudflare R2: cliente S3-compatible, generación de presigned
// URLs para upload, keys y URLs públicas.
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @aws-sdk/client-s3                  → S3Client, PutObjectCommand
// @aws-sdk/s3-request-presigner       → getSignedUrl
// @/lib/constants                     → R2_IMAGES_FOLDER, MAX_PRODUCT_IMAGES
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/api/upload/r2-presigned/route.ts
// lib/services/product.service.ts
// ──────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { MAX_PRODUCT_IMAGES, R2_IMAGES_FOLDER } from "@/lib/constants"

// ─── Constantes ───────────────────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? ""
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? ""
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? ""
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? ""
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
const PRESIGNED_URL_EXPIRES_IN = 3600

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

// ─── Cliente singleton ────────────────────────────────────────────────────────

let s3ClientInstance: S3Client | null = null

function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      requestHandler: {
        requestTimeout: 30_000,
      },
    })
  }
  return s3ClientInstance
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UploadResult = {
  publicUrl: string
  fileKey: string
}

type PresignedUploadUrlResult = UploadResult & {
  uploadUrl: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateFileKey(fileName: string, productId?: string): string {
  const fileExtension = fileName.split(".").pop() ?? "jpg"
  const timestamp = Date.now()
  const folder = productId
    ? `${R2_IMAGES_FOLDER}/${productId}`
    : `${R2_IMAGES_FOLDER}/temp`

  return `${folder}/${timestamp}.${fileExtension}`
}

// ─── Upload directo (server-side) ─────────────────────────────────────────────

export async function uploadFileToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  productId?: string,
): Promise<UploadResult> {
  const fileKey = generateFileKey(fileName, productId)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
  })

  await getR2Client().send(command)

  const publicUrl = buildR2PublicUrl(fileKey)

  return { publicUrl, fileKey }
}

// ─── Presigned URL (browser-side) ─────────────────────────────────────────────

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  productId?: string,
): Promise<PresignedUploadUrlResult> {
  const fileKey = generateFileKey(fileName, productId)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN,
  })

  const publicUrl = buildR2PublicUrl(fileKey)

  return { uploadUrl, publicUrl, fileKey }
}

// ─── Validación ───────────────────────────────────────────────────────────────

type ImageValidationResult = {
  isValid: boolean
  error?: string
}

export function validateImageUpload(
  contentType: string,
  fileSize: number,
  currentImageCount: number,
): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return {
      isValid: false,
      error: `Tipo de archivo no soportado: ${contentType}. Permitidos: JPEG, PNG, WebP, AVIF.`,
    }
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `El archivo excede el tamaño máximo de 10 MB.`,
    }
  }

  if (currentImageCount >= MAX_PRODUCT_IMAGES) {
    return {
      isValid: false,
      error: `Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto.`,
    }
  }

  return { isValid: true }
}

// ─── Keys & URLs ──────────────────────────────────────────────────────────────

export function buildR2PublicUrl(fileKey: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${fileKey}`
  }
  return `https://${R2_BUCKET_NAME}.r2.dev/${fileKey}`
}

export function generateProductImageKey(
  productId: string,
  fileName: string,
): string {
  const extension = fileName.split(".").pop() ?? "jpg"
  const timestamp = Date.now()
  return `${R2_IMAGES_FOLDER}/${productId}/${timestamp}.${extension}`
}

export function isValidImageFile(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type)
}

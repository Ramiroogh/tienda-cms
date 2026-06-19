// ─── Descripción ──────────────────────────────────────────────────────────────
// Singleton del cliente Prisma. Previene múltiples instancias en desarrollo
// con Hot Reload.
// Usa @prisma/adapter-neon para conexión a NeonDB (PostgreSQL serverless).
//
// ─── Dependencias ─────────────────────────────────────────────────────────────
// @/generated/prisma/client          → PrismaClient
// @prisma/adapter-neon              → PrismaNeon
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// lib/repositories/*.repository.ts
// lib/services/*.service.ts
// ──────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

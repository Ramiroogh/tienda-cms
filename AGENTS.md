# Tienda — CMS Interno (Gestión de Tienda de Ropa)

**No es e-commerce.** Sin carrito, checkout ni catálogo público. Ventas presenciales / redes sociales.

## Stack

- **Next.js 16** (App Router), React 19, TypeScript 5, Turbopack
- **Tailwind v4** — `@tailwindcss/postcss`, NO `tailwind.config.*`
- **shadcn/ui** — preset `radix-maia`, base `stone`. Añadir: `npx shadcn add`
- **NeonDB** (serverless Postgres) + **Prisma v7** (`prisma-client` generator)
- **Cloudflare R2** + `@aws-sdk/client-s3` (imágenes, implementado)
- **Sin** tests ni CI

## Comandos

```sh
npm run dev        # next dev (Turbopack)
npm run build      # next build
npm run start      # next start
npm run lint       # eslint (eslint.config.mjs)
npx prisma generate   # regenerar cliente tras cambiar schema
npx prisma migrate dev  # crear migración
npx shadcn add <c>     # añadir componente shadcn/ui
```

## Arquitectura (capas, implementada)

```
src/app/actions/*.actions.ts     → validan Zod, orquestan servicios
src/lib/services/*.service.ts    → lógica de negocio + reglas de integridad
src/lib/repositories/*.repository.ts → único punto de contacto con Prisma
src/lib/prisma.ts                 → singleton PrismaClient + PrismaNeon adapter
src/lib/validators/*.schema.ts    → schemas Zod v4
src/lib/errors/domain.errors.ts   → errores tipados del dominio
src/generated/prisma/             → cliente generado (gitignored, @ts-nocheck)
```

Path alias: `@/` → `./src/`

## Prisma v7 — gotchas

- **Generator**: `prisma-client` (NO `prisma-client-js`)
- **Config**: `prisma.config.ts` con `defineConfig` + `DATABASE_URL` del `.env` (el schema NO lleva `datasource.url`)
- **Adapter**: `@prisma/adapter-neon` (no driver nativo)
- **Import**: `import { PrismaClient } from "@/generated/prisma/client"` — el archivo tiene `@ts-nocheck`, NO usar namespace `$Enums`
- **Enum casts**: con `as any` y `eslint-disable`
- Migraciones existentes: `prisma/migrations/` con 2 migraciones ya aplicadas a NeonDB
- Después de cambiar schema: `npx prisma migrate dev` → `npx prisma generate`

## Reglas de negocio clave

- `stockLevel` / `soldCount` solo se modifican desde `stockService` — nunca via `prisma.productVariant.update` directo
- Toda modificación de stock crea un `StockMovement` (append-only, sin UPDATE/DELETE)
- Venta + descuento de stock + `StockMovement` van en `prisma.$transaction`
- `SaleItem.unitPrice` congela precio al momento de la venta
- Baja lógica siempre: `isActive = false`, nunca DELETE
- `productStatus`: `DRAFT` → `ACTIVE` → `INACTIVE`
- SKU auto-generado de 11 dígitos con retry (10 intentos)
- Server Actions usan `useActionState` (React 19): `const [state, formAction, isPending] = useActionState(action, undefined)`

## Módulos (todos con page + actions + service + repository + validator + types)

| Ruta | Propósito |
|---|---|
| `/dashboard` | Métricas (4 cards) + tabla de productos + accesos rápidos |
| `/products` | CRUD, formulario 3 pasos con variantes (sidebar lateral, tabla de combinaciones), imágenes drag & drop |
| `/stock` | Vista centralizada de stock + movimientos |
| `/sales` | Registro + historial de ventas |
| `/suppliers` | CRUD + detalle con órdenes de compra y productos vinculados |
| `/purchases` | Órdenes de compra + recepción |

## Variantes de producto

- Formulario 3 pasos en `/products/new` con VariantSidebar (panel lateral derecho)
- Hasta 3 propiedades por variante (`propertyName1-3` / `propertyValue1-3`)
- Tabla de combinaciones generada por producto cartesiano
- **Desajuste frontend↔backend**: el frontend envía `[{ propertyName, propertyValues }]` + `variantCombinations[]`, pero la API espera formato plano (cada fila es una combinación). Requiere adaptador. Ver `VARIANTS.md`.

## Upload de imágenes

Dos flujos a Cloudflare R2 (bucket `ceci-tienda-images`):
- **Proxy** (server-side, recomendado): `POST /api/upload/proxy` — recibe `FormData` con `file`, lo sube vía S3 SDK
- **Presigned URL**: `POST /api/upload/r2-presigned` — devuelve `{ uploadUrl, publicUrl }` (requiere CORS en bucket, no implementado)
- Validación: MIME jpeg/png/webp/avif, máx 10 MB, máx 6 imágenes por producto

## Skills cargados

- `neon`, `neon-postgres` — vía `skills-lock.json` desde `.agents/skills/`
- `Agente de Desarrollo` — vía OpenCode config global

## Referencias

- `system.md` — arquitectura completa (modelos, flujos, capas, estructura de carpetas)
- `DESIGN.md` — tokens de diseño (colores, tipografía, componentes shadcn, estados UI)
- `VARIANTS.md` — detalle del sistema de variantes (sidebar, combinaciones, desajuste API)
- `components.json` — configuración shadcn (aliases, iconos, estilos)
- `src/lib/constants.ts` — umbrales del dominio (`LOW_STOCK_THRESHOLD=5`, `MAX_PRODUCT_IMAGES=6`, etc.)

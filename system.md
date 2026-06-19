---
name: Tienda CMS — Sistema de Gestión Interna
description: Mantenimiento de registro de crecimiento del negocio, flujo de caja y tracking de productos. No es e-commerce.
stack: next js 16, typescript, react 19, shadcn --preset bJMUAev2, neon db, prisma v7, cloudflare r2
status: build + lint pasan limpios
---

# SYSTEM.md — CMS Tienda (Gestión Interna)

> Documento de referencia arquitectónica y lógica del proyecto.  
> Propósito: gestión interna de una tienda de ropa. No tiene canal de venta online.  
> Las ventas ocurren de forma presencial o por redes sociales.

---

## 1. Visión del Proyecto

Aplicación web privada para que la dueña de la tienda pueda:

- Registrar ventas (presenciales o por redes)
- Gestionar el stock de productos
- Cargar nuevos productos con fotos y variantes (talla, color, etc.)
- Administrar proveedores
- Vincular compras de mercadería a proveedores específicos

**No incluye:** carrito de compras, checkout, pagos online, catálogo público.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/postcss`) + shadcn/ui preset `bJMUAev2` |
| Base de datos | NeonDB (PostgreSQL serverless) |
| ORM | Prisma v7 (`prisma-client` generator, `prisma.config.ts`) |
| Almacenamiento de imágenes | Cloudflare R2 — bucket `ceci-tienda-images` (S3-compatible API) |
| S3 SDK | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |
| Autenticación | (postergada — pendiente de definir) |
| Deploy | Vercel |

---

## 3. Arquitectura (Capas)

```
┌─────────────────────────────────────────────────────────┐
│  UI (React Server Components / Client Components)       │
│  src/components/  src/app/*/page.tsx                    │
├─────────────────────────────────────────────────────────┤
│  Server Actions (src/app/actions/*.actions.ts)          │
│  → validan con Zod, orquestan servicios                 │
├─────────────────────────────────────────────────────────┤
│  Services (src/lib/services/*.service.ts)               │
│  → lógica de negocio, reglas de integridad              │
├─────────────────────────────────────────────────────────┤
│  Repositories (src/lib/repositories/*.repository.ts)    │
│  → único punto de contacto con Prisma                   │
├─────────────────────────────────────────────────────────┤
│  Infrastructure (src/lib/prisma.ts, src/lib/utils/)     │
│  → Prisma singleton, utilidades R2, etc.               │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Modelo de Datos (Prisma Schema — Real)

11 modelos + 5 enums. Migraciones aplicadas a NeonDB.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum ProductStatus { DRAFT ACTIVE INACTIVE }
enum SaleChannel  { PRESENCIAL INSTAGRAM WHATSAPP FACEBOOK OTRO }
enum PaymentMethod { EFECTIVO TRANSFERENCIA TARJETA OTRO }
enum PurchaseOrderStatus { PENDIENTE RECIBIDO PARCIAL CANCELADO }
enum StockMovementReason { PURCHASE SALE MANUAL_ADJUSTMENT INITIAL }

model Category {
  id               String     @id @default(cuid())
  name             String
  slug             String     @unique
  parentCategoryId String?
  createdAt        DateTime   @default(now())
  parent   Category?  @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]
}

model Brand {
  id        String   @id @default(cuid())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Product {
  id             String        @id @default(cuid())
  name           String
  description    String?
  sku            String?       @unique
  categoryId     String?
  brand          String?
  tags           String[]
  referenceLinks String[]
  imageUrls      String[]
  costPrice      Float?
  salePrice      Float
  productStatus  ProductStatus @default(DRAFT)
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  category      Category?            @relation(fields: [categoryId], references: [id])
  variants      ProductVariant[]
  saleItems     SaleItem[]
  purchaseItems PurchaseOrderItem[]
}

model ProductVariant {
  id         String @id @default(cuid())
  productId  String
  size       String?
  color      String?
  stockLevel Int    @default(0)
  soldCount  Int    @default(0)

  // Sistema flexible de variantes (hasta 3 propiedades)
  propertyName1  String?
  propertyValue1 String?
  propertyName2  String?
  propertyValue2 String?
  propertyName3  String?
  propertyValue3 String?

  price   Float?    // null = hereda precio del producto
  weight  Float?
  barcode String?

  product        Product             @relation(fields: [productId], references: [id])
  saleItems      SaleItem[]
  purchaseItems  PurchaseOrderItem[]
  stockMovements StockMovement[]

  @@unique([productId, size, color])
}

model VariantOption {
  id    String @id @default(cuid())
  type  String
  value String
  order Int    @default(0)

  @@unique([type, value])
}

model Sale {
  id             String        @id @default(cuid())
  saleDate       DateTime      @default(now())
  saleChannel    SaleChannel
  paymentMethod  PaymentMethod
  discountAmount Float         @default(0)
  saleTotal      Float
  notes          String?
  createdAt      DateTime      @default(now())
  items          SaleItem[]
  stockMovements StockMovement[]
}

model SaleItem {
  id           String  @id @default(cuid())
  saleId       String
  productId    String
  variantId    String?
  soldQuantity Int
  unitPrice    Float
  sale    Sale            @relation(fields: [saleId], references: [id])
  product Product         @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id])
}

model Supplier {
  id            String   @id @default(cuid())
  businessName  String
  contactPerson String?
  phone         String?
  email         String?
  address       String?
  notes         String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  purchaseOrders PurchaseOrder[]
}

model PurchaseOrder {
  id             String              @id @default(cuid())
  supplierId     String
  orderStatus    PurchaseOrderStatus @default(PENDIENTE)
  purchaseDate   DateTime            @default(now())
  receivedAt     DateTime?
  invoiceNumber  String?
  totalOrderCost Float?
  notes          String?
  createdAt      DateTime            @default(now())
  supplier       Supplier             @relation(fields: [supplierId], references: [id])
  items          PurchaseOrderItem[]
  stockMovements StockMovement[]
}

model PurchaseOrderItem {
  id              String @id @default(cuid())
  purchaseOrderId String
  productId       String
  variantId       String?
  orderedQuantity Int
  unitCost        Float
  purchaseOrder PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id])
  product       Product         @relation(fields: [productId], references: [id])
  variant       ProductVariant? @relation(fields: [variantId], references: [id])
}

model StockMovement {
  id                String              @id @default(cuid())
  variantId         String
  movementReason    StockMovementReason
  quantityDelta     Int
  stockLevelBefore  Int
  stockLevelAfter   Int
  relatedSaleId     String?
  relatedPurchaseId String?
  notes             String?
  createdAt         DateTime            @default(now())
  variant         ProductVariant  @relation(fields: [variantId], references: [id])
  relatedSale     Sale?           @relation(fields: [relatedSaleId], references: [id])
  relatedPurchase PurchaseOrder?  @relation(fields: [relatedPurchaseId], references: [id])
}
```

> **Notas de implementación:**
> - El cliente Prisma se genera en `src/generated/prisma/` (gitignored). El schema no lleva `datasource.url` porque se define en `prisma.config.ts` desde `DATABASE_URL` del `.env`.
> - Los tipos se importan desde `@/generated/prisma/client` (el archivo generado tiene `@ts-nocheck`, no usar `$Enums` namespace).
> - Los enum casts se hacen con `as any` y `eslint-disable`.
> - `ProductVariant` soporta hasta 3 propiedades por variante. Si se necesitan más, agregar `propertyName4/value4`.
> - `VariantOption` persiste el historial de tipos/valores usados para sugerencias.

---

## 5. Reglas de Integridad de Negocio

1. **Stock inmutable fuera de stockService:** `stockLevel` y `soldCount` solo se modifican desde `stockService`. Nunca via `prisma.productVariant.update` directo.
2. **StockMovement append-only:** toda modificación de stock crea un registro `StockMovement`. Nunca UPDATE/DELETE sobre movimientos.
3. **Transacción atómica de venta:** venta + descuento de stock + `StockMovement` van en una sola `prisma.$transaction`.
4. **Precio congelado:** `SaleItem.unitPrice` guarda el precio al momento de la venta.
5. **Baja híbrida:** productos sin historial (nunca vendidos ni comprados) se eliminan físicamente (delete en cascada: StockMovement → Variants → Product). Productos con historial solo se dan de baja (`isActive = false`). Proveedores siempre baja lógica.
6. **Ciclo de vida del producto:** `ACTIVE` por defecto al crear. Transiciones: `ACTIVE` → `INACTIVE` (dar de baja), `INACTIVE` → `ACTIVE` (reactivar).
7. **Stock negativo:** no permitido. Validación en servicio antes de toda venta.
8. **SKU auto-generado:** 11 dígitos, único, generado en `createProductAction` con retry de 10 intentos.
9. **Variante única:** si no hay variantes configuradas, se crea una variante simple sin talla/color.
10. **Fusión de variantes:** si se agrega un tipo de variante ya existente, los valores se fusionan (sin duplicados).
11. **Stock según tipo de producto:** productos simples usan `payload.stock` del formulario; productos con variantes usan `v.stockLevel` por combinación.
12. **Transacciones sin anidar:** `stockService.increaseStock/decreaseStock` aceptan `tx?: Prisma.TransactionClient` opcional para ejecutarse dentro de una transacción padre, evitando transacciones anidadas.

---

## 6. Módulos del Sistema

```
CMS Tienda
├── Dashboard        → resumen (4 cards), ventas del día/mes, stock bajo, tabla de productos
├── Productos        → CRUD + imágenes + variantes (3 pasos)
├── Stock            → vista centralizada + movimientos
├── Ventas           → registro + historial
├── Proveedores      → CRUD + detalle con órdenes y productos vinculados
└── Compras          → órdenes de compra + recepción
```

---

## 7. Sistema de Variantes (Productos)

### 7.1 Arquitectura

El formulario de creación de producto (`/products/new`) usa un flujo de **3 pasos** con barra de progreso visual (círculos numerados + línea conectora):

```
[1. Información] ——— [2. Configuración] ——— [3. Revisión]
```

### 7.2 Paso 1 — Información básica + Variantes

- Campos: nombre, descripción, marca, categoría (select), etiquetas, enlaces de referencia
- Subida de imágenes con drag & drop (hasta 6, reordenables)
- Configuración de variantes mediante **VariantSidebar** (panel lateral derecho)

### 7.3 VariantSidebar

Panel lateral con animación (300ms) y overlay oscuro:

| Estado | Descripción |
|---|---|
| Cerrado | No se renderiza |
| Abierto (nueva) | Crea variante nueva |
| Abierto (edición) | Precarga datos existentes |

**Estructura interna:**
1. **Selector de Propiedad** — Dropdown custom con backdrop, 4 opciones: Talle, Color, Tamaño, Material
2. **Valores seleccionados** — Lista con drag & drop nativo (SVG 6 círculos), botón X para eliminar
3. **Agregar valor personalizado** — Input + botón "+", persiste en localStorage
4. **Valores sugeridos** — Checklist con defaults + historial del usuario. Valores ya usados en otra variante se deshabilitan con "(ya agregado)"
5. **Footer** — Botón "Crear (N valores)" / "Guardar cambios". Deshabilitado si no hay valores.
6. **Fusión**: si el mismo `propertyName` ya existe, los valores se fusionan con `Set` (sin duplicados)

### 7.4 Paso 2 — Configuración

**Producto SIN variantes:** formulario con precio de venta, precio de costo y **stock inicial** (input numérico).

**Producto CON variantes:**
1. **Resumen de variantes** — Tags por tipo con botón × para eliminar valores
2. **Precio base** — Valor que heredan las combinaciones sin precio propio
3. **Tabla de combinaciones** — Generada mediante **producto cartesiano** recursivo. Cada fila editable: stock (input numérico) + precio (input con prefijo $). Las combinaciones previas se preservan al regenerar usando `combination` como clave.
4. Cada variante persiste su `stockLevel` y `price` individual en la DB. Si todas comparten precio, la tabla de productos muestra el valor; si difieren, muestra "Con variantes" con modal.

### 7.5 Paso 3 — Revisión

Muestra resumen completo: nombre, descripción, marca, categoría, etiquetas, precios, variantes (conteo de combinaciones), preview de combinaciones, imágenes en grid.

**Envío final:**
- Construye `FormData` con todos los campos
- Las variantes se aplanan al formato `propertyName1/value1`, `propertyName2/value2`, `propertyName3/value3` (hasta 3 props)
- `createProductAction` genera SKU de 11 dígitos único y llama a `productService.createProductDraft`

### 7.6 Persistencia del formulario

El borrador del formulario se guarda automáticamente en `sessionStorage` al navegar entre pasos o recargar la página. Se pierde al cerrar la pestaña.

**Guardias de navegación:**
- `popstate` — botón atrás del navegador
- Interceptor de clics en `<a>` (fase capture) — navegación por sidebar o links
- `beforeunload` — cierre de pestaña/recarga
- Si hay cambios sin guardar, se muestra `UnsavedChangesModal` con opciones: Guardar y salir / Descartar / Cancelar

---

## 8. Subida de Imágenes a Cloudflare R2

### 8.1 Configuración del Bucket

Bucket: `ceci-tienda-images` en Cloudflare R2.

**Autenticación:** R2 API Token (User API Token), scoped al bucket con permisos:
- Object Read
- Object Write

**SDK:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.

**Cliente S3 singleton** en `src/lib/utils/r2.utils.ts` — apunta a:
```
https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

### 8.2 Dos Flujos de Upload

#### Flujo A — Proxy (server-side, recomendado para formularios)
```
Browser → POST /api/upload/proxy (multipart/form-data)
       → Server recibe File, lo sube a R3 via S3 SDK (PutObjectCommand)
       → Devuelve { publicUrl, fileKey }
```
Sin CORS. El servidor de Next.js es el que escribe en R2.

**Endpoint:** `POST /api/upload/proxy`
- Body: `FormData` con campo `file` (File) + opcional `productId` (string) + `currentImageCount` (number)
- Response: `{ success, data: { publicUrl, fileKey } }`
- Validación: MIME (image/jpeg, image/png, image/webp, image/avif), tamaño máx 10 MB, máx 6 imágenes por producto

#### Flujo B — Presigned URL (browser directo, requiere CORS en bucket)
```
Browser → POST /api/upload/r2-presigned → { uploadUrl, publicUrl }
       → PUT imagen directo a R2 usando uploadUrl
```
Requiere CORS configurado en el bucket de R2. No implementado aún.

**Endpoint:** `POST /api/upload/r2-presigned`
- Body: `{ fileName, contentType, fileSize, productId?, currentImageCount? }`
- Response: `{ success, data: { uploadUrl, publicUrl, fileKey } }`
- Validez: 1 hora

### 8.3 Organización de Archivos

```
productos/
├── {productId}/
│   ├── {timestamp}.jpg
│   └── {timestamp}.png
└── temp/
    └── {timestamp}.webp
```

### 8.4 ImageUploader (Frontend)

Componente en `src/components/products/ImageUploader.tsx`:
- Zona de drop con feedback visual (`border-primary` + bg highlight)
- File picker nativo al hacer clic
- Validación: tipo MIME, tamaño máx 10 MB, límite 6 imágenes
- Thumbnails en grid responsive `grid-cols-3 sm:grid-cols-4 md:grid-cols-6`
- Reordenamiento drag & drop entre thumbnails
- Botón hover para eliminar cada imagen
- Numeración automática en cada thumbnail

---

## 9. Layout y Navegación

### 9.1 Sidebar (`src/components/layout/Sidebar.tsx`)

Sidebar moderno y minimalista:
- Ancho fijo `w-56`, fondo `bg-sidebar`, borde derecho
- Logo "Tienda CMS" en el header
- Íconos de lucide-react (`LayoutDashboard`, `Package`, `ShoppingCart`, `Truck`, `ClipboardList`, `Warehouse`)
- Item activo con `bg-sidebar-primary text-sidebar-primary-foreground`
- Items inactivos con `hover:bg-accent`
- Footer con versión "CMS v1.0"

### 9.2 Layout (`src/app/layout.tsx`)

- `flex min-h-full` (sidebar + main)
- Main con `p-12` (3rem de padding en todos los lados)

---

## 10. Dashboard

### 10.1 Estructura

```
Dashboard
├── Título "Panel de Control" (text-2xl font-semibold tracking-tight)
├── Grid 4 cards (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
│   ├── SaleSummaryCard     → Ventas de hoy
│   ├── MonthlySalesCard    → Ventas del mes
│   ├── ActiveProductsCard  → Productos activos
│   └── LowStockAlert       → Stock bajo (con lista de productos)
├── Sección "Productos Recientes"
│   └── ProductTable (con búsqueda)
└── QuickActions (grid 4 cards con íconos en círculos translúcidos)
```

### 10.2 Componentes

| Componente | Descripción |
|---|---|
| `SaleSummaryCard` | Ventas del día (server component) |
| `MonthlySalesCard` | Ventas del mes (server component) |
| `ActiveProductsCard` | Conteo de productos activos (server component) |
| `LowStockAlert` | Productos con stock ≤ 5, lista con cantidades |
| `QuickActions` | 4 accesos directos con íconos lucide en círculos `bg-primary/10` |
| `ProductTable` | Tabla con búsqueda inline, paginación y estados (loading/empty) |

---

## 11. Productos — Vista de Listado

### 11.1 Página `/products`

```
Header: Título "Productos" + botón "Nuevo producto"
MetricsWidget (card sutil): Total productos | Activos | Vendidos | Stock total
ProductsTable: Búsqueda + tabla paginada (11 items) + multi-select + 3-dot menu
```

### 11.2 ProductsTable (`src/components/products/ProductsTable.tsx`)

| Característica | Detalle |
|---|---|
| Búsqueda | Input con ícono Search, filtra por nombre/SKU/marca |
| Multi-select | Checkbox por fila + select-all en header. Contador de seleccionados |
| 3-dot menu | Editar, Activar/Dar de baja, Eliminar (con modal `ConfirmDeleteModal`) |
| Paginación | 11 items por página, ChevronLeft/ChevronRight, contador "X–Y de Z" |
| Estados | Skeleton loading, empty state, sin resultados |
| Filas | Clickeables → navegan al detalle |
| **Stock** | Suma de `stockLevel` de todos los variants del producto |
| **Precio** | Si todas las variantes comparten precio → lo muestra. Si difieren → link "Con variantes" que abre `VariantInfoModal` con lista de combinaciones y precios |

**Eliminación de productos:**
- Sin historial de ventas ni compras → elimina físicamente (StockMovements → Variants → Product)
- Con historial → muestra error: "No se puede eliminar: el producto tiene ventas u órdenes de compra. Puede darlo de baja para ocultarlo del catálogo."

### 11.3 MetricsWidget (`src/components/products/MetricsWidget.tsx`)

Widget minimalista estilo Google que muestra 4 métricas en línea:
- Total productos
- Activos
- Vendidos (suma de `soldCount` de todas las variantes)
- Stock total (suma de `stockLevel` de todas las variantes)

### 11.4 SKU Auto-generado

- 11 dígitos numéricos (entre 10.000.000.000 y 99.999.999.999)
- Generado en `createProductAction` con verificación de unicidad
- Hasta 10 reintentos en caso de colisión

---

## 12. Proveedores

### 12.1 Página `/suppliers`

```
Header: Título "Proveedores" + botón "Nuevo proveedor"
SuppliersTable: Búsqueda + tabla paginada (11 items) + 3-dot menu
```

### 12.2 SuppliersTable (`src/components/suppliers/SuppliersTable.tsx`)

- Búsqueda por nombre comercial y persona de contacto
- Avatar `rounded-full bg-primary/10` con ícono Building2
- Badge "Inactivo" en `text-destructive` para proveedores inactivos
- 3-dot menu: Ver detalle, Editar, Dar de baja
- Paginación con 11 items por página
- Loading skeleton y empty state con ícono

### 12.3 Página `/suppliers/[id]` (Detalle)

```
Header: Botón "Volver" (ChevronLeft) + título "Detalle del Proveedor"
1. Card de datos: avatar, nombre, badge estado, grid 4 columnas (contacto, teléfono, email, dirección), notas
2. Órdenes de Compra: tabla ordenada (pendientes → parciales → recibidas → canceladas)
3. Productos Vinculados: reutiliza ProductsTable con filtro supplierId
```

Los productos vinculados se filtran mediante la relación `purchaseItems → purchaseOrder → supplierId` en el repositorio.

---

## 13. Estructura de Carpetas (Real)

```
src/
├── app/
│   ├── api/
│   │   └── upload/
│   │       ├── proxy/route.ts          → POST (server-side upload)
│   │       └── r2-presigned/route.ts   → POST (presigned URL)
│   ├── dashboard/page.tsx
│   ├── products/
│   │   ├── page.tsx                    → listado + métricas
│   │   ├── new/page.tsx                → formulario 3 pasos + variantes
│   │   └── [id]/page.tsx              → detalle / edición
│   ├── sales/
│   │   ├── page.tsx                    → historial
│   │   ├── new/page.tsx                → registro de venta
│   │   └── [id]/page.tsx              → detalle
│   ├── suppliers/
│   │   ├── page.tsx                    → listado con tabla
│   │   ├── new/page.tsx                → formulario creación
│   │   └── [id]/page.tsx              → detalle + órdenes + productos
│   ├── purchases/
│   │   ├── page.tsx                    → historial
│   │   ├── new/page.tsx                → nueva orden
│   │   └── [id]/page.tsx              → detalle / recepción
│   ├── stock/page.tsx                  → vista general stock
│   ├── test-upload/page.tsx            → página de prueba R2
│   ├── layout.tsx                      → layout con sidebar
│   └── page.tsx                        → redirect a /dashboard

├── components/
│   ├── layout/
│   │   └── Sidebar.tsx                 → sidebar de navegación
│   ├── dashboard/
│   │   ├── SaleSummaryCard.tsx         → ventas del día
│   │   ├── MonthlySalesCard.tsx        → ventas del mes
│   │   ├── ActiveProductsCard.tsx      → conteo activos
│   │   ├── LowStockAlert.tsx           → stock bajo
│   │   └── QuickActions.tsx            → accesos rápidos
│   ├── products/
│   │   ├── ProductForm.tsx             → formulario 3 pasos
│   │   ├── ProductsTable.tsx           → tabla con paginación + multi-select
│   │   ├── ProductTable.tsx            → tabla simple (dashboard)
│   │   ├── ProductFilters.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ProductList.tsx
│   │   ├── ImageUploader.tsx           → drag & drop imágenes
│   │   ├── VariantSidebar.tsx          → panel lateral variantes
│   │   ├── VariantCombinationsTable.tsx → tabla de combinaciones
│   │   ├── MetricsWidget.tsx           → métricas de productos
│   │   ├── AddItemModal.tsx            → modal reutilizable crear items inline
│   │   ├── CategorySelector.tsx        → selector categorías con creación inline
│   │   ├── BrandSelector.tsx           → selector marcas con creación inline (persiste en DB)
│   │   ├── VariantInfoModal.tsx        → modal detalle variantes con precios
│   │   ├── ConfirmDeleteModal.tsx      → modal confirmación eliminar
│   │   └── UnsavedChangesModal.tsx     → modal cambios sin guardar
│   ├── sales/
│   │   ├── SaleHistory.tsx
│   │   ├── SaleFilters.tsx
│   │   ├── SaleForm.tsx
│   │   └── SaleDetail.tsx
│   ├── suppliers/
│   │   ├── SuppliersTable.tsx          → tabla con búsqueda y paginación
│   │   ├── SupplierForm.tsx
│   │   ├── SupplierDetail.tsx          → detalle + órdenes + productos
│   │   └── SupplierList.tsx
│   ├── purchases/
│   │   ├── PurchaseList.tsx
│   │   ├── PurchaseForm.tsx
│   │   └── PurchaseDetail.tsx
│   ├── stock/
│   │   └── StockDashboard.tsx
│   └── ui/                             → shadcn/ui components (table, button, dropdown-menu, input, select)

├── lib/
│   ├── prisma.ts                       → singleton PrismaClient con Neon adapter
│   ├── constants.ts                    → LOW_STOCK_THRESHOLD, MAX_PRODUCT_IMAGES, PRODUCT_STATUS_BADGE, etc.
│   ├── errors/domain.errors.ts         → clases de error tipadas
│   ├── repositories/                   → product, sale, purchase, stock, category, brand
│   ├── services/                       → productService, saleService, purchaseService, stockService, categoryService, brandService
│   ├── validators/                     → schemas Zod para cada módulo
│   ├── utils/
│   │   ├── r2.utils.ts                 → cliente S3 + upload + presigned
│   │   ├── currency.utils.ts           → formatPriceARS
│   │   └── date.utils.ts              → formatDateShort, formatDateTime
│   └── types/                          → product, sale, purchase, stock, category

├── actions/                            → product, sale, purchase, stock, category, brand

└── generated/prisma/                   → cliente generado (gitignored)
```

---

## 14. Variables de Entorno (.env)

```env
DATABASE_URL="postgresql://neondb_owner:npg_W6o5TPmKiQbC@ep-orange-truth-acj3aexm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

R2_ACCOUNT_ID="37f608dc24f73aee40cbd79e051089e4"
R2_ACCESS_KEY_ID="7e338099aca177e42e8edbac1d345ebf"
R2_SECRET_ACCESS_KEY="f4d7341808f98956d604bae36701aed8b90d8f3509ff7362673adcf7f43219fd"
R2_BUCKET_NAME="ceci-tienda-images"
R2_PUBLIC_URL="https://pub-ab1789f8a54f48bc89878b23ccf27e1e.r2.dev"
```

---

## 15. Server Actions (Formularios)

Todas las acciones usan `useActionState` en el cliente (React 19):

```ts
// Patrón obligatorio en componentes "use client"
const [state, formAction, isPending] = useActionState(
  async (_prev: ActionResult | undefined, formData: FormData) => actionName(formData),
  undefined,
)
```

Tipo `ActionResult`: `{ success: boolean; data?: any; error?: string }`

Módulos de actions:
- `product.actions.ts` — create (SKU auto), update, getProducts, getProductById, activate, deactivate, **deleteProduct**
- `sale.actions.ts` — registerSale, getSales, getSaleById
- `purchase.actions.ts` — createSupplier, updateSupplier, getSuppliers, getSupplierById, registerRestock, getPurchaseOrders, getPurchaseOrderById
- `stock.actions.ts` — adjustStock, getStockMovements
- `category.actions.ts` — createCategory, getAllCategories, getCategoryTree
- `brand.actions.ts` — createBrand, getBrands

### SKU auto-generado (createProductAction)

```ts
function generateSku(): string {
  const min = 10_000_000_000
  const max = 99_999_999_999
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

async function generateUniqueSku(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const sku = generateSku()
    const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } })
    if (!existing) return sku
  }
  throw new Error("No se pudo generar un SKU único después de 10 intentos")
}
```

---

## 16. Comandos

```sh
npm run dev        # next dev (Turbopack)
npm run build      # next build
npm run start      # next start
npm run lint       # eslint
npx prisma generate    # regenerar cliente Prisma
npx prisma migrate dev # nueva migración
npx shadcn add <component>  # agregar componente shadcn/ui
```

---

## 17. Constantes del Sistema (src/lib/constants.ts)

| Constante | Valor | Propósito |
|---|---|---|
| `LOW_STOCK_THRESHOLD` | 5 | Umbral para considerar stock bajo |
| `MAX_PRODUCT_IMAGES` | 6 | Máximo de imágenes por producto |
| `DEFAULT_PAGE_SIZE` | 20 | Items por página en listados |
| `PRODUCT_STATUS_OPTIONS` | DRAFT, ACTIVE, INACTIVE | Opciones para filtros |
| `PRODUCT_STATUS_BADGE` | { label, variant } | Config de badges por estado |
| `STOCK_STATUS_LABELS` | IN_STOCK, LOW_STOCK, OUT_OF_STOCK | Labels de disponibilidad |

---

## 18. Próximos Pasos

- [x] Inicializar proyecto Next.js 16 + shadcn + Tailwind v4
- [x] Configurar NeonDB + Prisma v7 + migración init
- [x] Schema completo (10 modelos + 5 enums)
- [x] Arquitectura por capas (actions, services, repositories)
- [x] Validadores Zod v4 para todos los módulos
- [x] Componentes UI de todos los módulos (scaffold)
- [x] Server actions con validación
- [x] Configurar R2 y endpoint de upload (proxy server-side funcional)
- [x] Página de prueba de subida de imágenes
- [x] Sidebar de navegación moderna
- [x] Dashboard con métricas reales (4 cards + tabla de productos)
- [x] Tabla de productos con paginación, multi-select y 3-dot menu
- [x] Formulario de producto en 3 pasos con variantes (talla, color, tamaño, material)
- [x] ImageUploader con drag & drop, reordenamiento y eliminación
- [x] Sistema de variantes con sidebar lateral y combinaciones cartesianas
- [x] SKU auto-generado de 11 dígitos
- [x] Productos vinculados en detalle de proveedor
- [x] Tabla de proveedores con búsqueda y paginación
- [ ] Autenticación
- [ ] Selectores de producto/proveedor en formularios de compra/venta
- [ ] Filtros funcionales en listados de ventas y compras
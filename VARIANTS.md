# Sistema de Variantes para Productos

## Arquitectura General

El sistema de variantes permite configurar productos con múltiples opciones (talle, color, tamaño, material) generando automáticamente todas las combinaciones posibles para asignarles precio, stock, SKU y peso individual.

### Archivos involucrados

- `page.tsx` (ruta `dashboard/products/new`) — Archivo "use client" que contiene toda la lógica de variantes inline (2064 líneas). No hay hooks, componentes ni stores separados.
- `route.ts` (ruta `api/products`) — API route que crea el producto con sus variantes en base de datos.
- `route.ts` (ruta `api/variant-options`) — API route para persistir tipos y valores de variante por cuenta de usuario.
- `schema.prisma` — Modelos `ProductVariant` y `VariantOption`.
- `route.ts` (ruta `api/categories`) — API route para categorías.
- `route.ts` (ruta `api/upload`) — API route para subir imágenes a R2/Cloudflare.
- `prisma.ts` — Singleton de PrismaClient.
- `auth.config.ts` — Configuración NextAuth para autenticación.
- `proxy.ts` — Middleware de protección de rutas del dashboard.

---

## Modelo de Datos (Prisma)

### ProductVariant

Cada variante representa una fila en la tabla de combinaciones. Soporta hasta 3 propiedades por variante (e.g., Talle=8 + Color=Negro).

```prisma
model ProductVariant {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])

  propertyName1   String?   // "Talle", "Color", etc.
  propertyValue1  String?   // "8", "Negro", etc.
  propertyName2   String?
  propertyValue2  String?
  propertyName3   String?
  propertyValue3  String?

  stock           Int      @default(0)
  sku             String?   // SKU específico de la variante
  price           Float?    // null = hereda precio del producto
  barcode         String?
}
```

### VariantOption

Almacena por usuario los tipos y valores que ha usado históricamente, para sugerirlos al crear nuevas variantes.

```prisma
model VariantOption {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  type      String   // "Talle", "Color", "Tamaño", "Material"
  value     String   // "33", "Violeta", "Grande", "Cuero"
  order     Int      @default(0)

  @@unique([userId, type, value])
}
```

---

## Flujo de Usuario: 3 Pasos

### PASO 1 — Datos básicos + Configuración de Variantes

El formulario muestra una sección "Variantes del Producto" con:

1. **Lista de variantes configuradas** — Si `savedVariants.length > 0`, se renderizan como tarjetas con:
   - Nombre de la propiedad (Talle, Color, etc.)
   - Badges con los valores asignados
   - Botón "Editar variante" (solo visible en hover)
   - Botón "Eliminar variante" (siempre visible)

2. **Botón "Agregar variantes"** — Abre el sidebar lateral.

#### Anatomía del Sidebar de Variantes

El sidebar es un panel fijo lateral derecho (z-50) con overlay oscuro que se abre al hacer clic en "Agregar variantes" o "Editar variante". Tiene animación de entrada/salida con transición CSS (300ms).

**Estados del sidebar:**

| Estado | Condición | Comportamiento |
|---|---|---|
| Cerrado | `showVariantSidebar = false` | No se renderiza |
| Abierto (nueva) | `showVariantSidebar = true` + `editingVariantId = null` | Crea variante nueva |
| Abierto (edición) | `showVariantSidebar = true` + `editingVariantId = "id"` | Precarga datos de la variante existente |
| Cerrando | `sidebarClosing = true` | Aplica `translate-x-full`, tras 300ms oculta y resetea estados |

**Estructura interna del sidebar:**

1. **Header** — Botón volver, título dinámico ("Nueva propiedad" / "Valores de variante" / "Editar variante"), botón cerrar X.

2. **Selector de Propiedad** — Dropdown custom (no `<select>`) con 4 opciones hardcodeadas:
   - Talle
   - Color
   - Tamaño
   - Material
   
   Al seleccionar una propiedad, se resetean `variantValues` a `[]` y se muestra el campo de "Valores seleccionados". El dropdown tiene backdrop propio para cerrar al hacer clic fuera.

3. **Valores Seleccionados (con Drag & Drop)** — Lista renderizada con:
   - Icono de agarre (6 círculos SVG) para drag
   - Nombre del valor
   - Botón de eliminar (basurero)
   - **Drag & Drop**: Estados `draggedVariantIndex`, handlers `onDragStart`, `onDragOver`, `onDragEnd`. Al soltar se reordena el array mediante splice. No usa librería externa.
   - Si está vacío: muestra placeholder "Seleccioná valores de la lista de abajo"

4. **Agregar valor personalizado** — Input + botón "+". Al presionar Enter o clic:
   - Agrega el valor a `variantValues` (si no existe)
   - Lo persiste en `accountVariantOptions` (estado local)
   - Lo persiste en base de datos via `POST /api/variant-options` (si no existía previamente)
   - Limpia el input

5. **Valores Sugeridos** — Checklist renderizada desde `accountVariantOptions[selectedVariantType]`. Cada ítem:
   - Muestra checkbox + label
   - Si el valor ya está usado en cualquiera de las variantes guardadas (`isValueUsedInAnyVariant`): se deshabilita, muestra "(ya agregado)" y cursor not-allowed
   - Si no está usado: permite toggle con check

6. **Footer** — Botón "Crear (N valores)" / "Guardar cambios". Deshabilitado si `variantValues.length === 0`.

**Lógica de guardado (`saveVariant`):**

```typescript
if (editingVariantId) {
  // Actualizar variante existente por ID
  savedVariants.map(v => v.id === editingVariantId ? {...v, ...} : v)
} else {
  // Buscar si ya existe variante con mismo propertyName
  const existing = savedVariants.find(v => v.propertyName === selectedVariantType)
  if (existing) {
    // Fusionar valores (evitar duplicados con Set)
    [...new Set([...existing.propertyValues, ...variantValues])]
  } else {
    // Crear nueva variante con id = Date.now()
    savedVariants.push({ id, propertyName, propertyValues })
  }
}
```

**Side Effects al cerrar sidebar:**

- Si hay cambios sin guardar (`selectedVariantType` + valores diferentes al original): muestra modal de confirmación (¿Guardar cambios? / Descartar).
- Al cerrar: resetea `selectedVariantType`, `variantValues`, `editingVariantId` a null.

#### Carga inicial de datos

En un `useEffect` al montar el componente:
- `GET /api/categories` → carga categorías del usuario
- `GET /api/variant-options` → carga valores de variantes previamente usados, mergeándolos con defaults hardcodeados:
  ```typescript
  {
    Talle: ["5", "7", "9", "11", "24", "2XL", "3XL", "9,5"],
    Color: ["Negro", "Blanco", "Rojo", "Azul", "Verde", "Gris"],
    Tamaño: [],
    Material: [],
  }
  ```

---

### PASO 2 — Configuración (impacto de variantes)

**Producto SIN variantes** (`savedVariants.length === 0`):

Se muestra formulario simple con:
- Precio (obligatorio)
- SKU (opcional)
- Inventario (Limitado / Infinito + cantidad)
- Peso y dimensiones (alto, ancho, profundidad, peso)

**Producto CON variantes** (`savedVariants.length > 0`):

1. **Resumen de Variantes** — Tags de cada tipo con sus valores. Cada valor tiene botón "×" para eliminarlo directamente (si se elimina el último valor de un tipo, la variante se elimina).

2. **Tabla de Combinaciones** — Generada mediante **producto cartesiano** de todas las variantes:

   ```typescript
   // Algoritmo recursivo
   const generateCombinations = (current: string[], variantIndex: number) => {
     if (variantIndex >= savedVariants.length) {
       // Combinación completa: unir valores con " - "
       combinations.push({
         id: Date.now() + random,
         combination: current.join(" - "),
         values: [...current],
       })
       return
     }
     for (const value of savedVariants[variantIndex].propertyValues) {
       generateCombinations([...current, value], variantIndex + 1)
     }
   }
   ```

   **Ejemplo:** Si hay `Talle: [8, 9]` y `Color: [Negro, Blanco]`, se generan 4 filas:
   - 8 - Negro
   - 8 - Blanco
   - 9 - Negro
   - 9 - Blanco

   La tabla de combinaciones tiene columnas editables:
   - **Variante** — Nombre de la combinación (readonly)
   - **Stock** — Input numérico
   - **Precio** — Input numérico con prefijo "$"
   - **Peso (kg)** — Input numérico con sufijo "kg"
   - **Acciones** — Botón de editar (placeholder)

3. **Preservación de datos**: Al regresar del paso 3 o al regenerar combinaciones (por cambio en `savedVariants`), se preservan los valores existentes usando `combination` como clave: si una combinación previa coincide, mantiene stock/precio/sku/weight.

4. **Botón "Agregar variantes"** — Vuelve a abrir el sidebar para agregar más tipos de variante desde el paso 2.

**Validación al pasar a paso 3:**

```typescript
if (savedVariants.length === 0) {
  // Producto simple: precio obligatorio
  if (!price || price <= 0) → alert y bloquea
} else {
  // Producto con variantes: al menos una combinación debe tener precio
  if (!variantCombinations.some(c => c.price > 0)) → alert y bloquea
}
```

---

### PASO 3 — Revisión y Confirmación

Muestra resumen de todo el producto:

- **Card principal** — nombre, descripción, tipo (físico/digital)
- **Categorías** — badges con las categorías seleccionadas
- **Producto sin variantes** — grid con precio, stock, SKU, peso, dimensiones
- **Producto con variantes** — sección separada con:
  - Badge con cantidad total de combinaciones
  - Resumen de tipos y valores
  - Tabla de combinaciones (readonly) con columnas: Combinación, Precio, Stock, Peso
- **Imágenes** — grid 4 columnas con lightbox al hacer clic

#### Envío final (`handleSubmit`):

```typescript
// 1. Subir imágenes a R2 (secuencial)
for (const file of imageFiles) {
  POST /api/upload (FormData) → url
}

// 2. Construir payload
{
  name, description, productType,
  categoryIds: selectedCategories,
  images: uploadedUrls,
}

// 3. Si tiene variantes:
variants: savedVariants.map(v => ({
  propertyName: v.propertyName,
  propertyValues: v.propertyValues,
}))
variantCombinations: variantCombinations

// 4. Si NO tiene variantes:
price, sku, stock, stockUnlimited, weight, height, width, depth

// 5. POST /api/products
```

---

## API Route: POST /api/products

Recibe el producto y sus variantes. La implementación actual **solo procesa variantes con formato plano** (`propertyName1`, `propertyValue1`, `propertyName2`...) y **no utiliza el formato combinado** que envía el frontend (arrays `variants` con `propertyName`/`propertyValues` + `variantCombinations`).

**Comportamiento actual:**

```typescript
if (variants && variants.length > 0) {
  await prisma.productVariant.createMany({
    data: variants.map(v => ({
      productId: product.id,
      propertyName1: v.propertyName1,
      propertyValue1: v.propertyValue1,
      propertyName2: v.propertyName2,
      propertyValue2: v.propertyValue2,
      stock: parseInt(v.stock) || 0,
      sku: v.sku,
      price: v.price ? parseFloat(v.price) : null,
      barcode: v.barcode,
    }))
  })
}
```

**⚠️ Existe un desajuste frontend ↔ backend**: El frontend envía variantes como `[{ propertyName: "Talle", propertyValues: ["8","9"] }]` más `variantCombinations` con precios/stocks, pero la API espera un array plano donde cada objeto es UNA combinación con `propertyName1/value1` y opcionalmente `propertyName2/value2`. La integración real requiere un adaptador que transforme las combinaciones del frontend al formato plano de la base de datos.

---

## API Route: /api/variant-options

| Método | Función |
|---|---|
| **GET** | Lista opciones del usuario agrupadas por tipo: `{ options: { Talle: [...], Color: [...] } }` |
| **POST** | Crea nueva opción: `{ type, value }`. Usa `@@unique([userId, type, value])` para evitar duplicados. Maneja orden auto-incremental por tipo. |
| **DELETE** | Elimina opción por ID. Verifica que pertenezca al usuario autenticado. |

---

## Drag & Drop (sin librerías externas)

### Reordenar imágenes (Paso 1)

Estados: `draggedIndex`, `imageFiles[]`.

```typescript
handleDragStart(index)  → setDraggedIndex(index)
handleDragOver(e, index) → splice del elemento dragged a nueva posición
handleDragEnd()          → setDraggedIndex(null)
```

### Reordenar valores de variante (Sidebar)

Estados: `draggedVariantIndex`, `variantValues[]`. Misma lógica que imágenes.

Ambos usan eventos nativos HTML5 Drag & Drop sin librerías externas. La imagen/variante arrastrada recibe clase `opacity-50`.

---

## Validaciones Clave

1. **Nombre del producto**: obligatorio para avanzar al paso 2.
2. **Precio (sin variantes)**: obligatorio y debe ser > 0.
3. **Precio (con variantes)**: al menos una combinación debe tener precio > 0.
4. **Sidebar**: no se puede guardar variante sin valores seleccionados (`variantValues.length === 0`).
5. **Duplicados en sidebar**: si se selecciona un valor ya usado en otra variante del mismo tipo, se deshabilita y muestra "(ya agregado)".
6. **Fusión de variantes**: si se crea una variante con un `propertyName` ya existente, los valores se fusionan (no se duplican).
7. **Cambios sin guardar**: al cerrar sidebar con cambios pendientes, muestra modal de confirmación.

---

## Estados de Carga y UI

| Estado | Indicador |
|---|---|
| Subiendo imágenes | Spinner animado + texto "Subiendo imágenes..." |
| Guardando producto | Spinner en botón "Siguiente" / "Confirmar y guardar" |
| Sin variantes | Inputs simples de precio/stock/peso |
| Con variantes | Tabla de combinaciones editable |
| Sidebar vacío | Placeholder "Seleccioná valores de la lista de abajo" |
| Sin categorías | Mensaje "No tienes categorías creadas" |

---

## Diagrama de Transición de Estados (Variantes)

```
[Inicio]
    │
    ▼
savedVariants = []
    │
    ├── [Click "Agregar variantes"]
    │       │
    │       ▼
    │   showVariantSidebar = true
    │   selectedVariantType = null
    │   variantValues = []
    │       │
    │       ├── [Seleccionar propiedad]
    │       │       ▼
    │       │   selectedVariantType = "Talle" | "Color" | "Tamaño" | "Material"
    │       │   variantValues = []
    │       │       │
    │       │       ├── [Toggle valores sugeridos | Escribir valor custom]
    │       │       │       ▼
    │       │       │   variantValues = [..., "NuevoValor"]
    │       │       │       │
    │       │       │       └── [POST /api/variant-options] (si no existía)
    │       │       │
    │       │       └── [Click "Crear (N valores)"]
    │       │               ▼
    │       │           saveVariant()
    │       │               │
    │       │               ├── ¿Existe mismo propertyName?
    │       │               │   ├── Sí → fusionar valores (Set)
    │       │               │   └── No → crear nueva Variant en savedVariants
    │       │               │
    │       │               └── closeSidebar()
    │       │
    │       └── [Cerrar con cambios]
    │               ▼
    │           showUnsavedChangesModal = true
    │               ├── "Guardar cambios" → saveVariant()
    │               └── "Descartar" → closeSidebar() sin guardar
    │
    ├── [Click "Siguiente" (Paso 1 → 2)]
    │       ▼
    │   currentStep = 2
    │       │
    │       ├── savedVariants.length === 0
    │       │       ▼
    │       │   Vista: formulario precio/stock/peso simple
    │       │
    │       └── savedVariants.length > 0
    │               ▼
    │           generateVariantCombinations() → producto cartesiano
    │           Vista: tabla de combinaciones editable
    │
    └── [Paso 2 → 3]
            ▼
        goToStep3() con validaciones
```

---

## Notas para la Implementación en Otro Sistema

1. **El frontend envía variantes como**: `[{ propertyName: "Talle", propertyValues: ["8","9"] }]` más un array separado `variantCombinations` con los precios/stocks por combinación.
2. **La base de datos almacena**: Una fila por combinación con hasta 3 pares propiedad/valor.
3. **Se requiere un adaptador** que recorra el producto cartesiano y genere las filas planas con `propertyName1/value1`, `propertyName2/value2`, etc., asignando el stock/precio/sku correspondiente de cada combinación.
4. **El modelo `ProductVariant` soporta hasta 3 propiedades** por variante. Si se necesitan más, habría que agregar `propertyName4`/`propertyValue4` o migrar a un modelo JSON.
5. **Los valores sugeridos por usuario** se cargan al montar la página y se actualizan en tiempo real al agregar nuevos valores personalizados.
6. **No hay transacciones de base de datos**: la creación del producto, imágenes y variantes se hace en llamadas separadas. Para producción, convendría envolver en `prisma.$transaction()`.
7. **El sistema es 100% inline (sin stores)**: toda la lógica vive en el componente de página. Para escalar, se recomienda extraer a hooks personalizados (`useVariants`, `useProductForm`) y componentes (`VariantSidebar`, `VariantsTable`).

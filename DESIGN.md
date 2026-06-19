---
name: Estilo y patrón de diseño para la tienda
description: este documento registra el formato de diseño que usaremos, mediante una configuración predefinida.
---
# DESIGN.md — Sistema de Diseño Visual del CMS

> Referencia de diseño para vibe coding con shadcn/ui (estilo `radix-maia`).
> Todo componente visual del proyecto debe ser consistente con este documento.
> Complementa SYSTEM.md (arquitectura) y SKILL.md (código). No repetir aquí lo que está allá.

---

## 1. Identidad Visual del Proyecto

**Concepto:** CMS de gestión moderno y minimalista. No es un ecommerce ni un dashboard analítico complejo. Es una herramienta de trabajo diario — debe sentirse limpia, rápida de leer y sin ruido visual.

**Palabras clave del diseño:** claro · funcional · tranquilo · profesional · cálido

**Lo que NO es:** oscuro por defecto · colorido · denso · decorativo · corporativo frío

---

## 2. Stack de Diseño

| Herramienta | Rol |
|---|---|
| shadcn/ui | Componentes base (Button, Input, Table, Card, Dialog, etc.) |
| Tailwind CSS v4 | Utilidades, espaciado, layout |
| `radix-maia` preset | Sistema de tokens (colores, radios, tipografía) |
| `stone` base color | Paleta de grises cálidos (arena/piedra) |
| lucide-react | Iconografía (único set de íconos permitido) |
| oklch | Espacio de color de todos los tokens |

**Regla:** usar primero un componente de shadcn. Si no existe, construir con Tailwind usando los tokens del tema. Nunca hardcodear colores en hex ni rgb.

---

## 3. Tokens del Tema — Referencia Rápida

### 3.1 Colores (light mode)

| Token | Valor oklch | Uso semántico |
|---|---|---|
| `--background` | `oklch(1 0 0)` | Fondo de página — blanco puro |
| `--foreground` | `oklch(0.147 0.004 49.25)` | Texto principal — casi negro cálido |
| `--card` | `oklch(1 0 0)` | Fondo de cards y paneles |
| `--card-foreground` | `oklch(0.147 0.004 49.25)` | Texto dentro de cards |
| `--primary` | `oklch(0.52 0.105 223.128)` | Azul acero — acciones principales |
| `--primary-foreground` | `oklch(0.984 0.019 200.873)` | Texto sobre primario (blanco azulado) |
| `--secondary` | `oklch(0.967 0.001 286.375)` | Gris muy claro — acciones secundarias |
| `--secondary-foreground` | `oklch(0.21 0.006 285.885)` | Texto sobre secundario |
| `--muted` | `oklch(0.97 0.001 106.424)` | Fondos sutiles, filas alternadas |
| `--muted-foreground` | `oklch(0.553 0.013 58.071)` | Texto de soporte, placeholders, labels |
| `--accent` | `oklch(0.97 0.001 106.424)` | Hover states, highlights sutiles |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Rojo — eliminar, dar de baja, error |
| `--border` | `oklch(0.923 0.003 48.717)` | Bordes — arena muy claro |
| `--input` | `oklch(0.923 0.003 48.717)` | Borde de inputs |
| `--ring` | `oklch(0.709 0.01 56.259)` | Focus ring — stone medio |
| `--sidebar` | `oklch(0.985 0.001 106.423)` | Fondo sidebar — blanco arena |
| `--sidebar-primary` | `oklch(0.609 0.126 221.723)` | Ítem activo del sidebar |

### 3.2 Colores de Charts (para métricas del dashboard)

```
chart-1  oklch(0.869 0.005 56.366)  → stone claro    (volumen bajo)
chart-2  oklch(0.553 0.013 58.071)  → stone medio     (volumen medio)
chart-3  oklch(0.444 0.011 73.639)  → stone oscuro
chart-4  oklch(0.374 0.01 67.558)   → stone muy oscuro
chart-5  oklch(0.268 0.007 34.298)  → casi negro cálido
```

### 3.3 Radio de bordes

| Token | Cálculo | Valor aprox. | Uso |
|---|---|---|---|
| `--radius-sm` | `radius × 0.6` | `0.375rem` | Badges, tags, chips pequeños |
| `--radius-md` | `radius × 0.8` | `0.5rem` | Inputs, selects, botones |
| `--radius-lg` | `radius` | `0.625rem` | Cards, modales, dropdowns |
| `--radius-xl` | `radius × 1.4` | `0.875rem` | Panels grandes, sidebars |
| `--radius-2xl` | `radius × 1.8` | `1.125rem` | Contenedores hero |

---

## 4. Tipografía

El tema usa **una sola familia** para todo (sans-serif del sistema o Geist si se configura). No hay distinción dramática entre headings y body — la jerarquía se logra con peso y tamaño, no con familias distintas.

```css
--font-sans:    var(--font-sans)        /* body, UI */
--font-mono:    var(--font-geist-mono)  /* código, SKUs, IDs */
--font-heading: var(--font-sans)        /* headings — misma familia */
```

### Escala tipográfica para el CMS

| Rol | Clase Tailwind | Uso |
|---|---|---|
| Page title | `text-2xl font-semibold tracking-tight` | Título de cada página |
| Section heading | `text-base font-medium` | Títulos de secciones dentro de una página |
| Card title | `text-sm font-medium` | Título dentro de una card |
| Body | `text-sm` | Contenido general, tablas |
| Support / label | `text-xs text-muted-foreground` | Fechas, IDs, metadata secundaria |
| Mono | `text-xs font-mono` | SKUs, IDs de registro, números de factura |

**Regla:** nunca usar `text-lg` o mayor para contenido de tabla o formulario. El CMS es denso en información — la tipografía debe ser compacta pero legible.

---

## 5. Componentes shadcn — Cuándo Usar Cada Uno

Mapa de qué componente shadcn usar en cada contexto del CMS. No improvisar.

### 5.1 Tablas de datos

```tsx
// Usar: Table de shadcn
// NO usar: divs con grid para tablas de datos

import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// Estructura:
<div className="rounded-lg border bg-card">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[200px]">Producto</TableHead>
        <TableHead>Categoría</TableHead>
        <TableHead className="text-right">Stock</TableHead>
        <TableHead className="text-right">Precio</TableHead>
        <TableHead className="w-[80px]" />  {/* acciones */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(row => <TableRow key={row.id}>...</TableRow>)}
    </TableBody>
  </Table>
</div>
```

### 5.2 Formularios

```tsx
// Usar: shadcn Form + react-hook-form + zod
// Cada campo: Label + Input/Select/Textarea dentro de FormField

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Layout de formulario estándar:
<div className="grid gap-4 md:grid-cols-2">
  <FormField name="productName" ... />    {/* ocupa 1 columna */}
  <FormField name="sku" ... />
  <FormField name="description" className="md:col-span-2" ... />  {/* full width */}
</div>
```

### 5.3 Cards de métricas

```tsx
// Usar: Card de shadcn
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Ventas hoy
    </CardTitle>
    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-semibold">{formatPriceARS(totalVentasHoy)}</div>
    <p className="text-xs text-muted-foreground mt-1">
      {cantidadVentasHoy} transacciones
    </p>
  </CardContent>
</Card>
```

### 5.4 Modales / Confirmaciones destructivas

```tsx
// Usar: Dialog para modales normales
// Usar: AlertDialog para acciones destructivas (dar de baja, cancelar orden)

// AlertDialog para "Dar de baja producto":
import { AlertDialog, AlertDialogAction, AlertDialogCancel,
         AlertDialogContent, AlertDialogDescription,
         AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

// NUNCA: window.confirm() o modales custom desde cero
```

### 5.5 Dropdowns de acciones por fila

```tsx
// Usar: DropdownMenu con ícono de tres puntos (MoreHorizontal de lucide)
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem,
         DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Ver detalle</DropdownMenuItem>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Dar de baja</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 5.6 Badges de estado

```tsx
// Usar: Badge de shadcn con variantes semánticas
import { Badge } from '@/components/ui/badge'

// NO usar colores hardcodeados. Definir variantes por estado del dominio:

// Estado de producto
const PRODUCT_STATUS_BADGE: Record<ProductStatus, { label: string; variant: string }> = {
  DRAFT:    { label: 'Borrador',  variant: 'secondary' },
  ACTIVE:   { label: 'Activo',    variant: 'default'   },
  INACTIVE: { label: 'Inactivo',  variant: 'outline'   },
}

// Estado de orden de compra
const PURCHASE_STATUS_BADGE: Record<PurchaseOrderStatus, { label: string; variant: string }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'secondary'    },
  RECIBIDO:  { label: 'Recibido',  variant: 'default'      },
  PARCIAL:   { label: 'Parcial',   variant: 'outline'      },
  CANCELADO: { label: 'Cancelado', variant: 'destructive'  },
}

// Canal de venta
const SALE_CHANNEL_BADGE: Record<SaleChannel, string> = {
  PRESENCIAL: 'Presencial',
  INSTAGRAM:  'Instagram',
  WHATSAPP:   'WhatsApp',
  FACEBOOK:   'Facebook',
  OTRO:       'Otro',
}

// Uso:
const statusConfig = PRODUCT_STATUS_BADGE[product.productStatus]
<Badge variant={statusConfig.variant as any}>{statusConfig.label}</Badge>
```

### 5.7 Indicador de stock

```tsx
// Componente propio (no existe en shadcn) pero usa tokens del tema

// components/stock/StockLevelIndicator.tsx
const STOCK_INDICATOR_CONFIG = {
  out_of_stock: { label: 'Sin stock', className: 'text-destructive font-medium' },
  low_stock:    { label: 'Stock bajo', className: 'text-amber-600 font-medium'  },
  in_stock:     { label: 'En stock',   className: 'text-emerald-600'            },
}

// Regla: el número de stock siempre va acompañado del indicador visual
<div className="flex items-center gap-1.5">
  <span className="text-sm">{stockLevel} u.</span>
  <span className={cn('text-xs', config.className)}>{config.label}</span>
</div>
```

### 5.8 Inputs de búsqueda y filtros

```tsx
// Barra de herramientas sobre cualquier tabla: búsqueda + filtros + acción primaria
<div className="flex items-center justify-between gap-4 mb-4">

  {/* Búsqueda */}
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input placeholder="Buscar productos..." className="pl-9" />
  </div>

  {/* Filtros */}
  <div className="flex items-center gap-2">
    <Select>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Categoría" />
      </SelectTrigger>
      <SelectContent>...</SelectContent>
    </Select>
  </div>

  {/* Acción primaria */}
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Nuevo producto
  </Button>

</div>
```

---

## 6. Variantes de Button — Cuándo Usar Cada Una

| Variante | Uso en el CMS |
|---|---|
| `default` (primario) | Acción principal de la página: "Registrar venta", "Guardar producto" |
| `secondary` | Acciones secundarias: "Ver detalle", "Exportar" |
| `outline` | Acciones neutrales en formularios: "Cancelar", "Volver" |
| `ghost` | Acciones en tabla: íconos, dropdowns, links de navegación |
| `destructive` | Solo en AlertDialog de confirmación. Nunca en tabla directamente. |
| `link` | Navegación inline dentro de texto |

```tsx
// Patrón para par de botones en formulario:
<div className="flex items-center justify-end gap-3 pt-4 border-t">
  <Button variant="outline" onClick={handleFormCancel}>Cancelar</Button>
  <Button disabled={isSubmitting}>
    {isSubmitting ? 'Guardando...' : 'Guardar producto'}
  </Button>
</div>
```

---

## 7. Estados de UI — Obligatorios en Toda Vista

Cada módulo debe manejar los 4 estados posibles. No dejar ninguno sin UI.

### Loading — usar Skeleton de shadcn

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Para tablas:
{Array.from({ length: 5 }).map((_, rowIndex) => (
  <TableRow key={rowIndex}>
    <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
  </TableRow>
))}
```

### Empty state — componente propio reutilizable

```tsx
// components/ui/EmptyState.tsx
type EmptyStateProps = {
  icon: LucideIcon
  emptyStateTitle: string
  emptyStateDescription?: string
  primaryAction?: React.ReactNode
}

// Uso en productos sin resultados:
<EmptyState
  icon={Package}
  emptyStateTitle="No hay productos cargados"
  emptyStateDescription="Comenzá registrando tu primera compra de mercadería."
  primaryAction={<Button>Registrar compra</Button>}
/>
```

### Error state

```tsx
// components/ui/ErrorMessage.tsx — alerta no intrusiva
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>{errorMessage}</AlertDescription>
</Alert>
```

### Success — Toast, no modal

```tsx
// Usar: sonner (ya viene con shadcn)
import { toast } from 'sonner'

// En el action result handler:
if (result.success) {
  toast.success('Venta registrada correctamente')
  router.push('/sales')
} else {
  toast.error(result.error)
}
```

---

## 8. Reglas de Diseño — Resumen para el Agente de IA

| Regla | Descripción |
|---|---|
| **Token first** | Siempre `text-foreground`, `bg-card`, `border-border`. Nunca `text-gray-900` ni colores hardcodeados. |
| **shadcn first** | Buscar primero en shadcn antes de construir un componente de UI desde cero. |
| **Un solo set de íconos** | Solo `lucide-react`. Nunca mezclar con heroicons, phosphor u otros. |
| **Badges semánticos** | Los estados del dominio (ProductStatus, PurchaseOrderStatus) tienen su propio mapa de badge. No improvisar colores por contexto. |
| **Destructive solo en AlertDialog** | El botón rojo de "dar de baja" nunca aparece directamente en la tabla. Siempre detrás de un dialog de confirmación. |
| **Toasts para feedback** | El feedback de acciones (éxito/error) es siempre un toast de sonner. Nunca un alert inline post-submit. |
| **Skeleton para loading** | No usar spinners genéricos. El skeleton mantiene el layout y reduce el efecto de parpadeo. |
| **Formularios en grid 2 columnas** | Los formularios usan `grid grid-cols-1 md:grid-cols-2 gap-4`. Los campos wide usan `md:col-span-2`. |
| **Espaciado consistente** | Entre secciones: `space-y-6`. Dentro de cards: `p-6`. Toolbar sobre tabla: `mb-4`. |
| **dark mode incluido** | El tema tiene variables `.dark` definidas. Los componentes deben funcionar en ambos modos usando solo los tokens — nunca fijar colores que rompan el dark mode. |
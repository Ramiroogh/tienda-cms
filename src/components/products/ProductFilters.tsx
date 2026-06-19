// ─── Descripción ──────────────────────────────────────────────────────────────
// Filtros para el listado de productos.
//
// ─── Usado por ────────────────────────────────────────────────────────────────
// app/products/page.tsx
// ──────────────────────────────────────────────────────────────────────────────

export function ProductFilters() {
  return (
    <div className="product-filters">
      <input
        type="search"
        name="searchTerm"
        placeholder="Buscar productos..."
        className="product-filters__input"
        form="product-filters-form"
      />

      <select name="productStatus" className="product-filters__select" form="product-filters-form">
        <option value="">Todos los estados</option>
        <option value="ACTIVE">Activos</option>
        <option value="DRAFT">Borradores</option>
        <option value="INACTIVE">Inactivos</option>
      </select>

      <button type="submit" form="product-filters-form" className="btn-secondary">
        Filtrar
      </button>
    </div>
  )
}

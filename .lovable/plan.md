

## Rediseño de On Demand -- Plan

### Archivos a modificar

**1. `src/components/ondemand/CategoryFilter.tsx`**
- Agregar categoría "Todos" (`{ value: "all", icon: PlayCircle, label: "Todos" }`) al inicio del array
- Estilo cyan glow para el botón seleccionado (shadow cyan, border cyan)
- Actualizar la interfaz `counts` para incluir `all`

**2. `src/components/ondemand/ContentGrid.tsx`**
- Eliminar `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` y sus imports
- Mostrar directamente: thumbnail → artista/banda → título → views count
- Reducir padding (CardHeader p-3, CardContent p-3)
- Hover: `group-hover:scale-[1.03]` en la card + sombra cyan (free) o amber (premium)
- Mantener badges de precio, favorito y playlist en hover sobre thumbnail

**3. `src/pages/OnDemand.tsx`**
- **Header**: Gradiente cyan sutil con icono Play grande, título "On Demand", contador total de contenido
- **Barra unificada**: Search + CategoryFilter + selector de orden en un solo bloque visual con fondo glassmorphism
- **Selector de orden**: State `sortBy` (`recent` | `popular` | `alphabetical`), aplicado con `useMemo` sobre `filteredContents`
- **Continuar viendo**: Agregar nombre del artista y tiempo restante ("3:45 restantes")
- **Estado vacío**: Mensaje contextual + botón para resetear filtro a "Todos"

### Sin cambios de base de datos

Todo es frontend. No requiere migraciones ni edge functions.


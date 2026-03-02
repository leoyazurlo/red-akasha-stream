

## Plan: Agregar búsqueda por provincia en el mapa

### Cambio

Agregar el campo `provincia` al flujo de datos y búsqueda del mapa. Actualmente se busca por `display_name`, `ciudad`, `pais` y `profile_type`, pero no por `provincia` aunque el campo existe en la base de datos.

### Archivos a modificar

**`src/components/live-map/artist-live-map.tsx`**:
1. Agregar `provincia` al tipo `ProfileOnMap`
2. Incluir `provincia` en la consulta `select` de Supabase
3. Agregar `p.provincia?.toLowerCase().includes(q)` al filtro de búsqueda
4. Mostrar la provincia en los resultados de búsqueda (ciudad, provincia, país) en lugar de solo ciudad y país
5. Actualizar el popup del marcador para incluir provincia cuando exista

**`src/components/live-map/map-search.tsx`**:
- Actualizar el placeholder a `"Buscar artista, ciudad, provincia o país..."`


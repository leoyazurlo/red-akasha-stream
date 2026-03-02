

## Plan: Corregir buscador del mapa para buscar por ciudad, país y tipo de perfil

### Problema

El buscador del mapa solo busca por nombre del artista (`display_name`). Si escribís "MORON" o "ARGENTINA", no encuentra nada porque no busca en los campos `ciudad`, `pais` ni `profile_type`.

### Solución

Modificar el filtro de búsqueda en `src/components/live-map/artist-live-map.tsx` para que busque en múltiples campos:

- **display_name** (nombre del artista)
- **ciudad** (ciudad)
- **pais** (país)
- **profile_type** (tipo de perfil, usando la etiqueta legible)

También actualizar el placeholder del input en `src/components/live-map/map-search.tsx` para indicar que se puede buscar por ciudad o país: "Buscar artista, ciudad o país..."

### Archivos a modificar

- `src/components/live-map/artist-live-map.tsx` — Expandir el filtro `searchResults` para incluir ciudad, país y tipo
- `src/components/live-map/map-search.tsx` — Actualizar placeholder del input


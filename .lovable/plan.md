

## On Demand: Dropdown con Audio y Video

### Cambios

**1. `src/components/Header.tsx`**
- Convertir el item "On Demand" en un dropdown con `children`:
  - "Audio" → `/on-demand/audio` (icono `Music`)
  - "Video" → `/on-demand/video` (icono `Video`)

**2. `src/App.tsx`**
- Agregar lazy import de una nueva página `OnDemandAudio`
- Agregar rutas:
  - `/on-demand/audio` → `OnDemandAudio`
  - `/on-demand/video` → `OnDemand` (la página actual)
- Mantener `/on-demand` redirigiendo a `/on-demand/video` (o mostrando la página actual)

**3. Crear `src/pages/OnDemandAudio.tsx`**
- Nueva página dedicada a contenido de audio (podcasts, música, etc.)
- Reutilizar la estructura visual de `OnDemand.tsx` (header gradiente cian, barra de filtros, grilla)
- Filtrar `content_uploads` por tipos de audio (`podcast`, `musica`, etc.) o por campo de tipo de medio
- Incluir el mismo sistema de detección de país, búsqueda, ordenamiento y animaciones

### Sin cambios de base de datos
Todo es frontend y reutiliza la tabla `content_uploads` existente.


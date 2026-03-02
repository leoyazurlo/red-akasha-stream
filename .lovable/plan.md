

## Diagnóstico

El video "Fungy" de Brian Viscione se ve pero no se escucha porque el navegador **silencia automáticamente** los videos con `autoPlay`. Las políticas de autoplay de Chrome, Firefox y Safari requieren que un video con `autoPlay` esté `muted` para reproducirse sin interacción previa. Si no se pone `muted`, el navegador igualmente puede silenciarlo o bloquear la reproducción.

**El problema está en `src/pages/VideoDetail.tsx` (línea 614)**: el elemento `<video>` tiene `autoPlay` pero no gestiona correctamente el audio para autoplay.

## Plan de corrección

### 1. Quitar `autoPlay` del `<video>` en VideoDetail.tsx
- Eliminar el atributo `autoPlay` de la línea 614
- En su lugar, iniciar la reproducción manualmente con `video.play()` dentro del evento `onLoadedMetadata`, lo que permite que el navegador reproduzca con audio ya que el usuario hizo click previo en "Play" (el botón que setea `isPlaying = true`)

### 2. Garantizar volumen inicial en 1
- En `onLoadedMetadata`, asegurar que `volume = 1` y `muted = false` explícitamente antes de llamar a `play()`

### 3. Mismo fix en QueuePlayerContext.tsx
- El `<video>` global del QueuePlayer (línea 167) también carece de control de volumen explícito
- Agregar `muted={false}` y asegurar que al cargar una nueva fuente, el volumen se establezca en 1

### Cambios concretos

**`src/pages/VideoDetail.tsx`**:
- Línea 614: Quitar `autoPlay`
- Líneas 630-635: En `onLoadedMetadata`, agregar lógica para establecer `volume = 1`, `muted = false`, y llamar a `play()` manualmente

**`src/contexts/QueuePlayerContext.tsx`**:
- En la lógica de carga de media (cuando cambia `currentItem`), asegurar que se establezca `volume = 1` y `muted = false` antes de `play()`


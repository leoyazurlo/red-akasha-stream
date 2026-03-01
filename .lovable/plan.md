

## Plan: Optimizar LCP (Largest Contentful Paint)

### Problemas identificados

El LCP del home page esta siendo afectado por varios factores simultaneos:

1. **CosmicBackground renderiza 120 elementos DOM animados** (100 estrellas + 20 brillantes) antes del contenido principal. Cada uno con `Math.random()` inline, animaciones CSS y box-shadows.

2. **Iframe de video se carga inmediatamente** (YouTube/Twitch embed) con `autoplay=1`, bloqueando el main thread.

3. **Header logo (`logo-red-akasha-header.png`) no tiene preload** - es el elemento LCP candidato pero se descubre tarde.

4. **Fonts de Google se cargan sin `font-display: swap`** en el `<link>` de `index.html`, causando FOIT (Flash of Invisible Text).

5. **3 queries de Supabase se disparan en paralelo** en el mount de Index (programas, shorts, destacados) + 1 del LiveStreamContext + 1 del Footer, todas waterfall-blocking el render.

6. **`useScrollAnimation` empieza con `isVisible = false`** para VideoCarousel, lo que significa que los carousels arrancan con `opacity-0` y no contribuyen al LCP aunque tengan contenido.

7. **`akasha-bg.png` se importa pero no se usa** (linea 10 de Index.tsx) - dead import que aumenta el bundle.

### Cambios propuestos

**1. index.html - Preload del logo header + font-display swap**
- Agregar `<link rel="preload">` para `logo-red-akasha-header.png` (candidato LCP).
- Agregar `&display=swap` al URL de Google Fonts para evitar FOIT.

**2. CosmicBackground.tsx - Reducir drasticamente el DOM inicial**
- Reducir de 100 a 30 estrellas y de 20 a 8 brillantes.
- Usar `will-change: transform` en contenedor para que el compositor maneje las animaciones sin repaints.

**3. Index.tsx - Eliminar import muerto + defer carousels below-the-fold**
- Eliminar `import akashaBg` (no se usa).
- Hacer que el primer VideoCarousel visible arranque con `isVisible = true` (sin esperar IntersectionObserver) para que contribuya al LCP.

**4. HomeVideoPlayer.tsx - Defer iframe load**
- No cargar el iframe hasta que el usuario interactue (click) o despues de 3 segundos (idle callback).
- Mostrar el thumbnail del video como placeholder estatico con boton de play.
- Eliminar el `useEffect` duplicado (lineas 19-23 son identicas a 14-18).

**5. Header.tsx - Agregar fetchpriority al logo**
- Agregar `fetchPriority="high"` al `<img>` del logo para priorizar su descarga.

**6. VideoRanking.tsx - Lazy load thumbnails**
- Agregar `loading="lazy"` a las imagenes del ranking (estan below-the-fold).

### Detalle tecnico

```text
Archivo                         Cambio                              Impacto LCP
───────────────────────────────────────────────────────────────────────────────
index.html                      preload logo + font-display:swap    -500ms (FOIT)
CosmicBackground.tsx            100→30 stars, 20→8 bright           -200ms (DOM/paint)
Index.tsx                       remove dead import                  -50ms (bundle)
HomeVideoPlayer.tsx             defer iframe, show thumbnail        -1500ms (iframe block)
Header.tsx                      fetchPriority="high" on logo        -300ms (discovery)
VideoRanking.tsx                loading="lazy" on thumbnails        -100ms (bandwidth)
```

Impacto estimado total: **~2-3 segundos** de mejora en LCP.


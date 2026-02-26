

## Diagnóstico: Pantalla Negra

### Resultado del análisis de `vite.config.ts`
No se encontraron security headers (CSP, X-Frame-Options, etc.) en el archivo. El archivo está limpio y no es la causa de la pantalla negra.

### Causa probable identificada: Conflicto de Service Workers

Existen **dos Service Workers compitiendo**:

1. **`public/sw.js`** -- Service Worker manual para cachear thumbnails. En su evento `install`, cachea `/` (la raíz) y llama `skipWaiting()` + `clients.claim()`.

2. **El SW generado por `vite-plugin-pwa` (Workbox)** -- Configurado con `registerType: "autoUpdate"`, cachea `**/*.{js,css,html,ico,png,svg}` y maneja navegación.

Ambos interceptan requests y compiten por el control. El SW manual puede servir una versión obsoleta de `/` desde su caché, causando la pantalla negra cuando el HTML cacheado no coincide con los assets JS/CSS actuales.

### Plan de corrección

1. **Eliminar `public/sw.js`** -- El SW manual es redundante. La funcionalidad de cacheo de thumbnails se puede migrar a la configuración de Workbox en `vite.config.ts`.

2. **Agregar regla de cacheo de thumbnails en `vite.config.ts`** -- Añadir un tercer `runtimeCaching` entry para las URLs de thumbnails con estrategia `CacheFirst`.

3. **Agregar purga del SW antiguo en `src/main.tsx`** -- Registrar lógica que desregistre cualquier SW antiguo de `/sw.js` al cargar la app, para limpiar cachés corruptos en usuarios existentes.

### Detalle técnico

```text
Antes:
  public/sw.js (manual) ──┐
                           ├── CONFLICTO → pantalla negra
  workbox SW (auto)    ────┘

Después:
  workbox SW (auto) ── único SW con regla de thumbnails integrada
  main.tsx ── purga sw.js antiguo en primera carga
```

**Archivos a modificar:**
- `public/sw.js` -- Eliminar
- `vite.config.ts` -- Agregar runtimeCaching para thumbnails
- `src/main.tsx` -- Agregar lógica de purga del SW manual antiguo


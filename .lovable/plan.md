
Objetivo: dejar el build “auto-recuperable” para que puedas publicar con seguridad y evitar que navegadores con caché vieja vuelvan a caer en pantalla negra.

1) Resultado de la revisión (rápido)
- `vite.config.ts` no define headers de seguridad (CSP, X-Frame-Options, HSTS, etc.), así que no hay nada ahí que esté bloqueando scripts.
- En código no hay `<link rel="canonical">` estático en `index.html` (bien para estabilidad de build).
- El problema más probable sigue siendo estado local de caché/Service Worker en algunos navegadores.
- Además, la purga actual en `src/main.tsx` usa `endsWith('/sw.js')`, que puede desregistrar también el SW válido de PWA (no solo el legacy), y eso conviene endurecerlo.

2) Plan de implementación (lo que voy a cambiar)
- Archivo: `src/main.tsx`
  - Reemplazar la purga actual por una purga “segura y de una sola vez”:
    - Ejecutar una sola vez por navegador (flag en `localStorage`).
    - Desregistrar solo si detecta señales reales de caché legacy (por ejemplo, caches antiguas `akasha-*`), no por nombre de script únicamente.
    - Limpiar solo caches legacy relevantes.
    - Hacer `reload` controlado una sola vez para evitar bucles.
- Archivo: `vite.config.ts`
  - Endurecer Workbox para converger más rápido a la versión nueva:
    - `cleanupOutdatedCaches: true`
    - `clientsClaim: true`
    - `skipWaiting: true`
  - Mantener el resto del runtime caching actual.
- Archivo: `src/hooks/useServiceWorker.ts`
  - Mantenerlo como no-op (sin registro manual), pero revisar que no haya rutas muertas/estado engañoso.
  - Si no se usa en ninguna parte, dejar explícito que es compatibilidad temporal o preparar retiro limpio en un paso posterior.

3) Detalles técnicos (sección técnica)
```text
Antes:
  main.tsx -> si scriptURL termina en /sw.js => unregister + reload
  Riesgo: también borra SW válido de vite-plugin-pwa

Después:
  main.tsx -> detectar "legacy cache footprint" + ejecutar una sola vez
            -> purgar legacy
            -> no tocar SW válido en cada carga
  vite.config.ts -> Workbox con skipWaiting + clientsClaim + cleanupOutdatedCaches
```

4) Verificación después de publicar
- Publicar (Update).
- Probar en:
  1) ventana incógnito,
  2) navegador donde fallaba.
- Confirmar en DevTools:
  - no errores de SW en consola,
  - SW activo corresponde al actual,
  - sin recargas en bucle.
- Si un navegador puntual sigue negro:
  - Application → Service Workers → Unregister,
  - Clear site data,
  - recargar.
- Si solo falla `www` y no el dominio publicado, revisar estado del dominio en Settings → Domains (root + www activos y apuntando correctamente).

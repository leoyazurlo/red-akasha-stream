

## Diagnóstico: Pantalla negra en redakasha.org

### Causa raíz
El purge de Service Worker en `main.tsx` solo limpia cachés con prefijo `akasha-`, pero Workbox (vite-plugin-pwa) genera cachés con prefijos como `workbox-precache-*` y otros. Cuando se despliega una nueva versión con hashes de chunks diferentes, el SW viejo sirve archivos JS que ya no existen → pantalla negra.

Además, si el SW cacheó el `index.html` anterior, el navegador ni siquiera descarga el nuevo HTML que contiene la lógica de purga.

### Archivos a modificar

**1. `src/main.tsx`** -- Purga más agresiva
- Expandir la purga para limpiar TODOS los cachés del navegador (no solo `akasha-`), incluyendo los de Workbox (`workbox-precache-*`, `google-fonts`, `supabase-*`)
- Desregistrar TODOS los Service Workers, no solo el legacy `/sw.js`
- Incrementar la versión del purge key a `v4` para que se ejecute de nuevo en navegadores afectados

**2. `vite.config.ts`** -- Configuración de Workbox más robusta
- Agregar `navigateFallback: '/index.html'` para que el SW siempre sirva el HTML correcto en rutas SPA
- Agregar `navigateFallbackAllowlist: [/^\/(?!api|supabase)/]` para que solo aplique a rutas de la app

### Lógica de la purga actualizada
```text
1. Cambiar PURGE_KEY a 'akasha_legacy_purged_v4'
2. Limpiar TODOS los cachés (caches.keys() → delete ALL)
3. Desregistrar TODOS los Service Workers (no solo /sw.js)
4. Recargar la página una vez
```

### Sin cambios de base de datos
Todo es frontend. Los usuarios afectados verán la purga ejecutarse una vez al abrir la página, limpiando los cachés corruptos.


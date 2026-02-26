

## Diagnostico de la Pantalla Negra en Produccion

### Hallazgo critico

Verifique ambas URLs publicadas (`red-akasha-stream.lovable.app` y `www.redakasha.org`). Ambas muestran pantalla negra. El HTML servido esta incompleto:

```text
Servido en produccion:
  <html lang="es">        <-- version vieja (source tiene lang="en")
    <div id="root"></div>  <-- sin <head>, sin <script>
  </html>

Esperado (source):
  <html lang="en">
    <head>... meta tags, fonts ...</head>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </html>
```

El HTML servido no tiene etiquetas `<script>`, por lo que React nunca se monta. Esto explica la pantalla negra para todos los visitantes, incluso los nuevos.

### Causa raiz encontrada: `useServiceWorker.ts` sigue registrando `/sw.js`

Aunque eliminamos `public/sw.js` y agregamos la purga en `main.tsx`, el archivo `src/hooks/useServiceWorker.ts` (linea 30) todavia intenta registrar `/sw.js`:

```typescript
const registration = await navigator.serviceWorker.register('/sw.js', {
  scope: '/',
});
```

Este hook esta exportado desde `src/hooks/index.ts`. Si algun componente lo importa (directa o indirectamente), re-registraria el SW fantasma. Aunque no encontre uso activo, el hook es codigo muerto peligroso.

### Problema principal: el deploy actual no tomo efecto

El HTML servido es de una version anterior (tiene `lang="es"`, sin scripts). Esto indica que el ultimo publish no se completo correctamente, o el Service Worker viejo en los navegadores de los usuarios sigue sirviendo el HTML cacheado sin scripts.

### Plan de correccion (2 pasos)

**Paso 1: Eliminar el hook `useServiceWorker.ts` y su export**

- Reescribir `src/hooks/useServiceWorker.ts` para que sea un no-op (no registre `/sw.js`), ya que `vite-plugin-pwa` maneja todo automaticamente.
- Remover la referencia de `src/hooks/index.ts`.

**Paso 2: Republish forzado**

Despues de los cambios, el usuario debe:
1. Hacer click en **Publish** > **Update** para forzar un nuevo deploy.
2. Abrir `www.redakasha.org` en una ventana de incognito para verificar.
3. Si persiste, abrir DevTools (F12) > Application > Service Workers > Unregister todo, luego recargar.

### Detalle tecnico

```text
Archivo                          Accion
-----------------------------------------
src/hooks/useServiceWorker.ts    Reescribir como no-op (delegar a vite-plugin-pwa)
src/hooks/index.ts               Remover export de useServiceWorker
```

El hook se reemplaza con una version que solo expone estado del SW de Workbox (sin registrar `/sw.js`), manteniendo la API publica por si algun componente futuro lo usa.


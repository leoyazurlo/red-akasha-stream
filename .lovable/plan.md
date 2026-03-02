
## Diagnóstico actual

El fix anterior de autoplay ya está aplicado, pero el caso de **Fungy** sigue mudo porque el archivo es `.mov` y llega con metadatos vacíos (`video_duration_seconds` y `audio_duration_seconds` en null), mientras otros `.mp4` sí tienen duración.  
Eso indica un problema de **compatibilidad de códec/audio del archivo** (no solo de autoplay).

**Do I know what the issue is?** Sí: el navegador reproduce imagen, pero no logra decodificar audio de ese `.mov` en este flujo.

## Plan de implementación

1. **Hacer robusto el arranque de reproducción con audio (VideoDetail)**
   - Archivo: `src/pages/VideoDetail.tsx`
   - Crear una función única de reproducción (`tryPlayWithAudio`) que:
     - Fuerce `volume = 1` y `muted = false`
     - Intente `play()`
     - Si falla por política del navegador, haga fallback controlado (mensaje al usuario para activar sonido con click)
   - Evitar depender solo de `onLoadedMetadata` para iniciar audio.

2. **Agregar detección y mensaje de incompatibilidad de audio**
   - Archivo: `src/pages/VideoDetail.tsx`
   - Incorporar un “watchdog” corto tras iniciar reproducción para detectar caso “video corre pero audio no decodifica”.
   - Mostrar estado explícito: “Este archivo se reproduce sin audio en este navegador por formato/códec” + CTA de descarga/reemplazo del archivo.
   - Así el usuario no queda con sensación de bug silencioso.

3. **Aplicar el mismo comportamiento al reproductor modal**
   - Archivo: `src/components/OnDemandPlayer.tsx`
   - Reutilizar la lógica de `tryPlayWithAudio` + manejo de fallback para que el problema no se repita en otros puntos de reproducción.

4. **Prevenir futuros uploads problemáticos**
   - Archivos:  
     - `src/components/VideoUpload.tsx`  
     - `src/lib/storage-validation.ts`
   - Endurecer validación:
     - Aceptar por defecto formatos de máxima compatibilidad (**MP4/WebM**).
     - Validar metadatos **antes** de dar por válida la subida (si no se puede leer metadato/audio reproducible, rechazar con mensaje claro).
   - Actualizar copy de ayuda para que no prometa compatibilidad de MOV/MKV.

5. **Alinear textos de interfaz**
   - Archivos: `src/i18n/locales/es.json`, `en.json`, `pt.json`, `zh.json`
   - Ajustar `upload.videoUploadDesc` al nuevo criterio de compatibilidad.

## Detalle técnico (resumen)

- No requiere cambios de base de datos ni backend.
- El problema principal no es “mute boolean”, sino **codec/audio track no compatible** en ciertos `.mov`.
- El objetivo del fix es doble:
  1) mejorar reproducción y fallback cuando el navegador bloquea audio,  
  2) impedir que entren archivos que luego se ven pero no se escuchan.

## Verificación prevista (end-to-end)

1. Abrir `/video/4e74c9bd-f89a-4004-8e97-a1e0b2d1d9fe` y confirmar que ya no queda “mudo sin feedback” (debe aparecer reproducción correcta o mensaje de incompatibilidad).
2. Subir un `.mp4` con audio y verificar sonido en `VideoDetail` y en reproductor modal.
3. Intentar subir `.mov/.mkv` y verificar bloqueo/mensaje preventivo.

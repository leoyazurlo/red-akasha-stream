

## Plan: Sistema de Completitud Mínima para Aprobación de Perfiles

### El problema actual

El formulario de registro (`Asociate.tsx`) solo exige: foto de perfil, bio de 10 caracteres, país y ciudad. Esto permite perfiles muy incompletos que los administradores deben aprobar o rechazar sin criterio claro.

### Mi consejo sobre la diferencia entre perfiles

No todos los perfiles tienen los mismos campos, así que propongo un **sistema de puntos ponderados** en vez de reglas rígidas iguales para todos:

```text
┌─────────────────────────────┬────────┬──────────────────────────────┐
│ Criterio                    │ Puntos │ Aplica a                     │
├─────────────────────────────┼────────┼──────────────────────────────┤
│ Perfil principal elegido    │   10   │ Todos                        │
│ Foto de perfil              │   10   │ Todos                        │
│ Nombre + Apellido           │    5   │ Todos                        │
│ País + Ciudad               │    5   │ Todos                        │
│ Bio (≥4 párrafos / 200 ch)  │   20   │ Todos                        │
│ Al menos 1 red social       │   10   │ Todos                        │
│ Al menos 4 fotos galería    │   15   │ Todos excepto amante_musica  │
│ Al menos 2 links YouTube    │   15   │ Todos excepto amante_musica  │
│ Campos específicos perfil   │   10   │ Solo perfiles que los tienen │
│   (instrumento, género,     │        │ (músico, DJ, banda, venue,   │
│    specs técnicas, etc.)    │        │  estudio, sello, etc.)       │
└─────────────────────────────┴────────┴──────────────────────────────┘
Total posible: 100 pts (varía por perfil)
Mínimo para enviar: 60% del total aplicable
```

Para **amante_de_la_musica** (fan): no se exigen fotos de galería ni videos, así que su total es 60 pts y necesita 36. Para un **músico**: total 100 pts, necesita 60.

### Qué se va a implementar

1. **Agregar campos de YouTube links y fotos de galería al formulario**
   - Reemplazar el upload de archivos de video por inputs de links de YouTube (mínimo 2 campos, botón para agregar más)
   - Cambiar el upload de imágenes para que funcione como galería (mínimo 4 fotos requeridas)

2. **Crear función `calculateProfileCompleteness`**
   - Utilidad reutilizable que recibe el tipo de perfil y los datos del formulario
   - Retorna: porcentaje, puntos obtenidos, puntos totales, y lista de items faltantes
   - Adapta los criterios según el tipo de perfil

3. **Barra de progreso visual en tiempo real**
   - Componente `RegistrationCompletionBar` que muestra el progreso mientras el usuario llena el formulario
   - Muestra qué falta completar con iconos de check/pendiente
   - Indica claramente el umbral del 60%

4. **Validación al enviar**
   - Bloquear el envío si no alcanza el 60%
   - Mostrar mensaje claro indicando qué falta

5. **Bio mejorada**
   - Cambiar el mínimo de 10 caracteres a 200 caracteres (aproximadamente 4 párrafos cortos)
   - Agregar contador de caracteres visible

### Archivos a modificar

- `src/pages/Asociate.tsx` — Agregar inputs de YouTube links, galería de fotos, barra de progreso, validación de completitud
- `src/lib/utils.ts` o nuevo archivo `src/lib/profile-completeness.ts` — Función `calculateProfileCompleteness`
- Posible nuevo componente `src/components/RegistrationCompletionBar.tsx`

### Detalle técnico: Campos de YouTube

Se agregan como un array de strings en el state del formulario (`video_links: string[]`), con validación de URL de YouTube. Estos se guardarán en `profile_details` vía la edge function `add-profile` (campo `video_links` o dentro de `technical_specs` como JSON).


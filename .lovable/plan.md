

## Plan: Subir el umbral mínimo a 70% y verificar el formulario

### Cambios necesarios

**1. Cambiar el umbral de 60% a 70%** en `src/lib/profile-completeness.ts`:
- Línea que dice `meetsMinimum: percentage >= 60` → cambiar a `percentage >= 70`

**2. Actualizar las referencias visuales al 60%** en `src/components/RegistrationCompletionBar.tsx`:
- El marcador visual que dice "60% mín." → "70% mín."
- La posición del marcador de `left: 60%` → `left: 70%`
- El texto que menciona "alcanzar al menos el 60%" → "70%"

**3. Actualizar la validación en `src/pages/Asociate.tsx`**:
- El mensaje de toast que dice "60%" → "70%"

### Impacto por tipo de perfil

Con el nuevo umbral del 70%:

```text
Perfil              Total pts   Necesita (70%)
─────────────────── ─────────── ──────────────
Músico/DJ/Banda     100 pts     70 pts
Fan (amante música)  60 pts     42 pts
Perfil sin campos    90 pts     63 pts
  específicos
```

### Archivos a modificar
- `src/lib/profile-completeness.ts` — umbral lógico
- `src/components/RegistrationCompletionBar.tsx` — indicadores visuales
- `src/pages/Asociate.tsx` — mensaje de validación


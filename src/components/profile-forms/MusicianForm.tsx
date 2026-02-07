/**
 * @fileoverview Formulario de registro para músicos.
 * Captura información específica de instrumentistas y cantantes.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { INSTRUMENTS, MUSIC_GENRES, EXPERIENCE_LEVELS } from "@/lib/constants";
import type { ProfileFormProps, MusicianFormData } from "@/lib/types";
import { AvatarField, BioField, SocialLinksFields, FormNote } from "./shared";

/**
 * Formulario de perfil para músicos
 */
export const MusicianForm = ({ formData, onChange }: ProfileFormProps<MusicianFormData>) => {
  return (
    <div className="space-y-4">
      {/* Avatar */}
      <AvatarField
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
      />

      {/* Instrumento principal */}
      <div className="space-y-2">
        <Label htmlFor="instrument">Instrumento principal *</Label>
        <Autocomplete
          options={[...INSTRUMENTS]}
          value={formData.instrument || ""}
          onValueChange={(value) => onChange("instrument", value)}
          placeholder="Selecciona tu instrumento"
          searchPlaceholder="Buscar instrumento..."
          emptyMessage="No se encontró ese instrumento"
        />
      </div>

      {/* Género musical */}
      <div className="space-y-2">
        <Label htmlFor="genre">Género musical *</Label>
        <Autocomplete
          options={[...MUSIC_GENRES]}
          value={formData.genre || ""}
          onValueChange={(value) => onChange("genre", value)}
          placeholder="Selecciona el género musical"
          searchPlaceholder="Buscar género..."
          emptyMessage="No se encontró ese género"
        />
      </div>

      {/* Nivel de experiencia */}
      <div className="space-y-2">
        <Label htmlFor="experience_level">Nivel de experiencia *</Label>
        <Select
          value={formData.experience_level || ""}
          onValueChange={(value) => onChange("experience_level", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nivel" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Biografía */}
      <BioField
        value={formData.bio || ""}
        onChange={(value) => onChange("bio", value)}
        label="Reseña/Bio (Experiencia y trayectoria)"
        placeholder="Cuéntanos tu trayectoria musical..."
        required
        rows={5}
      />

      {/* Formación académica */}
      <div className="space-y-2">
        <Label htmlFor="education">Formación académica</Label>
        <Input
          id="education"
          value={formData.education || ""}
          onChange={(e) => onChange("education", e.target.value)}
          placeholder="Ej: Conservatorio Nacional, autodidacta..."
        />
      </div>

      {/* Disponibilidad */}
      <div className="space-y-2">
        <Label htmlFor="available_for">Disponible para</Label>
        <Input
          id="available_for"
          value={formData.available_for || ""}
          onChange={(e) => onChange("available_for", e.target.value)}
          placeholder="Ej: sesiones de grabación, clases, shows en vivo..."
        />
      </div>

      {/* Redes sociales */}
      <SocialLinksFields
        formData={formData as Record<string, string>}
        onChange={onChange}
      />

      <FormNote>
        * Nota: Videos, audios y galería se podrán agregar después de completar el registro
      </FormNote>
    </div>
  );
};

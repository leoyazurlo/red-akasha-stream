/**
 * @fileoverview Formulario de registro para DJs.
 * Captura información específica de disc jockeys.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileFormProps, DJFormData } from "@/lib/types";
import { AvatarField, BioField, SocialLinksFields } from "./shared";

/**
 * Formulario de perfil para DJs
 */
export const DJForm = ({ formData, onChange }: ProfileFormProps<DJFormData>) => {
  return (
    <div className="space-y-4">
      {/* Avatar */}
      <AvatarField
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
      />

      {/* Biografía */}
      <BioField
        value={formData.bio || ""}
        onChange={(value) => onChange("bio", value)}
        label="Biografía / Estilo musical"
        placeholder="Describe tu estilo musical y experiencia como DJ..."
      />

      {/* Géneros */}
      <div className="space-y-2">
        <Label htmlFor="genre">Géneros que mezclas</Label>
        <Input
          id="genre"
          value={formData.genre || ""}
          onChange={(e) => onChange("genre", e.target.value)}
          placeholder="Ej: House, Techno, Electrónica"
        />
      </div>

      {/* Lugares */}
      <div className="space-y-2">
        <Label htmlFor="venues_produced">Lugares donde has tocado</Label>
        <Textarea
          id="venues_produced"
          value={formData.venues_produced || ""}
          onChange={(e) => onChange("venues_produced", e.target.value)}
          placeholder="Lista de venues y eventos"
          rows={3}
        />
      </div>

      {/* Redes sociales */}
      <SocialLinksFields
        formData={formData as Record<string, string>}
        onChange={onChange}
        fields={["instagram", "facebook"]}
      />
    </div>
  );
};

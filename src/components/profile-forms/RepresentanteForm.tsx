/**
 * @fileoverview Formulario de registro para representantes de artistas.
 * Captura información de managers y agentes.
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileFormProps, RepresentanteFormData } from "@/lib/types";
import { AvatarField, BioField, SocialLinksFields } from "./shared";

/**
 * Formulario de perfil para representantes
 */
export const RepresentanteForm = ({ formData, onChange }: ProfileFormProps<RepresentanteFormData>) => {
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
        label="Biografía profesional"
        placeholder="Describe tu experiencia como representante..."
      />

      {/* Artistas representados */}
      <div className="space-y-2">
        <Label htmlFor="produced_artists">Artistas representados</Label>
        <Textarea
          id="produced_artists"
          value={formData.produced_artists || ""}
          onChange={(e) => onChange("produced_artists", e.target.value)}
          placeholder="Lista de artistas que representas"
          rows={3}
        />
      </div>

      {/* Redes sociales */}
      <SocialLinksFields
        formData={formData as Record<string, string>}
        onChange={onChange}
        fields={["instagram", "linkedin", "whatsapp"]}
      />
    </div>
  );
};

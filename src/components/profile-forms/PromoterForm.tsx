/**
 * @fileoverview Formulario de registro para promotores de eventos.
 * Captura información específica de promotores y organizadores.
 */

import type { ProfileFormProps, PromoterFormData } from "@/lib/types";
import { AvatarField, SocialLinksFields, FormNote } from "./shared";

/**
 * Formulario de perfil para promotores
 */
export const PromoterForm = ({ formData, onChange }: ProfileFormProps<PromoterFormData>) => {
  return (
    <div className="space-y-4">
      {/* Avatar */}
      <AvatarField
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
      />

      {/* Redes sociales */}
      <SocialLinksFields
        formData={formData as Record<string, string>}
        onChange={onChange}
      />

      <FormNote>
        * Nota: Las salas donde produce, galerías de fotos y videos se podrán agregar después de completar el registro
      </FormNote>
    </div>
  );
};

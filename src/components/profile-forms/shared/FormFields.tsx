/**
 * @fileoverview Componentes reutilizables para formularios de perfil.
 * Proporciona campos estandarizados usados en todos los formularios de registro.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface SocialLinksFieldsProps {
  formData: Record<string, string>;
  onChange: (field: string, value: string) => void;
  /** Campos a mostrar. Por defecto: instagram, facebook, linkedin, email */
  fields?: ("instagram" | "facebook" | "linkedin" | "email" | "whatsapp" | "website")[];
}

/**
 * Campos de redes sociales reutilizables
 */
export function SocialLinksFields({ 
  formData, 
  onChange, 
  fields = ["instagram", "facebook", "linkedin", "email"] 
}: SocialLinksFieldsProps) {
  const fieldConfig = {
    instagram: { label: "Instagram", placeholder: "@tuusuario", type: "text" },
    facebook: { label: "Facebook", placeholder: "facebook.com/tuusuario", type: "text" },
    linkedin: { label: "LinkedIn", placeholder: "linkedin.com/in/tuusuario", type: "text" },
    email: { label: "Email", placeholder: "contacto@ejemplo.com", type: "email" },
    whatsapp: { label: "WhatsApp", placeholder: "+54 9 11 1234-5678", type: "tel" },
    website: { label: "Sitio Web", placeholder: "https://tusitio.com", type: "url" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => {
        const config = fieldConfig[field];
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>{config.label}</Label>
            <Input
              id={field}
              type={config.type}
              value={formData[field] || ""}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={config.placeholder}
            />
          </div>
        );
      })}
    </div>
  );
}

interface AvatarFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  required?: boolean;
}

/**
 * Campo de avatar/foto de perfil reutilizable
 */
export function AvatarField({ 
  value, 
  onChange, 
  label = "Foto de perfil (cuadrada)",
  description = "Sube una imagen cuadrada para tu perfil (formato recomendado: 400x400px)",
  required = true 
}: AvatarFieldProps) {
  return (
    <ImageUpload
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      description={description}
      allowLocalPreview={true}
    />
  );
}

interface BioFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

/**
 * Campo de biografía reutilizable
 */
export function BioField({ 
  value, 
  onChange, 
  label = "Biografía",
  placeholder = "Cuéntanos sobre ti...",
  required = false,
  rows = 4
}: BioFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="bio">{label} {required && "*"}</Label>
      <Textarea
        id="bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={rows > 4 ? "min-h-32" : undefined}
        rows={rows}
        required={required}
      />
    </div>
  );
}

interface FormNoteProps {
  children: React.ReactNode;
}

/**
 * Nota informativa al final de formularios
 */
export function FormNote({ children }: FormNoteProps) {
  return (
    <p className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

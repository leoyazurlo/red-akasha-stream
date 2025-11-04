import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PromoterFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const PromoterForm = ({ formData, onChange }: PromoterFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información del promotor artístico</h3>
      
      <div className="space-y-2">
        <Label htmlFor="promoterName">Nombre y apellido *</Label>
        <Input
          id="promoterName"
          value={formData.display_name || ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="Nombre y apellido"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={formData.instagram || ""}
            onChange={(e) => onChange("instagram", e.target.value)}
            placeholder="@tuusuario"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            value={formData.facebook || ""}
            onChange={(e) => onChange("facebook", e.target.value)}
            placeholder="facebook.com/tuusuario"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.linkedin || ""}
            onChange={(e) => onChange("linkedin", e.target.value)}
            placeholder="linkedin.com/in/tuusuario"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="contacto@promotor.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Las salas donde produce, galerías de fotos y videos se podrán agregar después de completar el registro
      </p>
    </div>
  );
};

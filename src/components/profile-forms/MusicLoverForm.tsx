import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MusicLoverFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const MusicLoverForm = ({ formData, onChange }: MusicLoverFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información de usuario</h3>
      
      <div className="space-y-2">
        <Label htmlFor="avatar_url">Foto de perfil (cuadrada) *</Label>
        <Input
          id="avatar_url"
          value={formData.avatar_url || ""}
          onChange={(e) => onChange("avatar_url", e.target.value)}
          placeholder="URL de la imagen"
          required
        />
        <p className="text-xs text-muted-foreground">Sube una imagen cuadrada para tu perfil</p>
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
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp || ""}
            onChange={(e) => onChange("whatsapp", e.target.value)}
            placeholder="+54 9 11 1234-5678"
          />
        </div>
      </div>
    </div>
  );
};

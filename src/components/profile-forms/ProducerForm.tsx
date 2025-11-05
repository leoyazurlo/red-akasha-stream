import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface ProducerFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const ProducerForm = ({ formData, onChange }: ProducerFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información del productor artístico</h3>
      
      <ImageUpload
        label="Foto de perfil (cuadrada)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube una imagen cuadrada para tu perfil (formato recomendado: 400x400px)"
        allowLocalPreview={true}
      />

      <div className="space-y-2">
        <Label htmlFor="producerName">Nombre del productor *</Label>
        <Input
          id="producerName"
          value={formData.display_name || ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="Nombre y apellido"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Reseña/Bio *</Label>
        <Textarea
          id="bio"
          value={formData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Cuéntanos tu historia y experiencia..."
          className="min-h-32"
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
            placeholder="contacto@productor.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Los artistas producidos, videos y audios se podrán agregar después de completar el registro
      </p>
    </div>
  );
};

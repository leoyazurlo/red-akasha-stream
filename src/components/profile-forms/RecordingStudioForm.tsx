import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface RecordingStudioFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const RecordingStudioForm = ({ formData, onChange }: RecordingStudioFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información del estudio de grabación</h3>
      
      <ImageUpload
        label="Foto de perfil (cuadrada)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube una imagen cuadrada del estudio (formato recomendado: 400x400px)"
        allowLocalPreview={true}
      />

      <div className="space-y-2">
        <Label htmlFor="studioName">Nombre del estudio *</Label>
        <Input
          id="studioName"
          value={formData.display_name || ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="Nombre del estudio"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="technicalSpecs">Ficha técnica de instalaciones</Label>
        <Textarea
          id="technicalSpecs"
          value={formData.technical_specs || ""}
          onChange={(e) => onChange("technical_specs", e.target.value)}
          placeholder="Describe el equipamiento y características técnicas..."
          className="min-h-32"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mapLocation">Ubicación (link de Google Maps)</Label>
        <Input
          id="mapLocation"
          value={formData.map_location || ""}
          onChange={(e) => onChange("map_location", e.target.value)}
          placeholder="https://maps.google.com/..."
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
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp || ""}
            onChange={(e) => onChange("whatsapp", e.target.value)}
            placeholder="+54 9 11 1234-5678"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Las galerías de fotos y audio se podrán subir después de completar el registro
      </p>
    </div>
  );
};

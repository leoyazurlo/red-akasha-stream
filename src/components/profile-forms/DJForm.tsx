import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface DJFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const DJForm = ({ formData, onChange }: DJFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <ImageUpload
          label="Foto de perfil"
          value={formData.avatar_url || ''}
          onChange={(url) => onChange('avatar_url', url)}
          required
        />
      </div>

      <div>
        <Label htmlFor="bio">Biografía / Estilo musical</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Describe tu estilo musical y experiencia como DJ..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="genre">Géneros que mezclas</Label>
        <Input
          id="genre"
          name="genre"
          placeholder="Ej: House, Techno, Electrónica"
          value={formData.genre || ''}
          onChange={(e) => onChange('genre', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="venues_produced">Lugares donde has tocado</Label>
        <Textarea
          id="venues_produced"
          name="venues_produced"
          placeholder="Lista de venues y eventos"
          value={formData.venues_produced || ''}
          onChange={(e) => onChange('venues_produced', e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          name="instagram"
          placeholder="usuario"
          value={formData.instagram || ''}
          onChange={(e) => onChange('instagram', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="facebook">Facebook</Label>
        <Input
          id="facebook"
          name="facebook"
          placeholder="https://facebook.com/djusuario"
          value={formData.facebook || ''}
          onChange={(e) => onChange('facebook', e.target.value)}
        />
      </div>
    </div>
  );
};

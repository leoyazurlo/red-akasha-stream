import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface ContenidoFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const ContenidoForm = ({ formData, onChange }: ContenidoFormProps) => {
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
        <Label htmlFor="bio">Biografía</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Cuéntanos sobre ti y tus gustos..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
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
          placeholder="https://facebook.com/usuario"
          value={formData.facebook || ''}
          onChange={(e) => onChange('facebook', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          name="linkedin"
          placeholder="https://linkedin.com/in/usuario"
          value={formData.linkedin || ''}
          onChange={(e) => onChange('linkedin', e.target.value)}
        />
      </div>
    </div>
  );
};

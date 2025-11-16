import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface ManagementFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const ManagementForm = ({ formData, onChange }: ManagementFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <ImageUpload
          label="Foto de perfil / Logo"
          value={formData.avatar_url || ''}
          onChange={(url) => onChange('avatar_url', url)}
          required
        />
      </div>

      <div>
        <Label htmlFor="bio">Descripción de servicios</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Describe tus servicios de management y experiencia..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="produced_artists">Artistas representados</Label>
        <Textarea
          id="produced_artists"
          name="produced_artists"
          placeholder="Lista de artistas que representas"
          value={formData.produced_artists || ''}
          onChange={(e) => onChange('produced_artists', e.target.value)}
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
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          name="linkedin"
          placeholder="https://linkedin.com/in/usuario"
          value={formData.linkedin || ''}
          onChange={(e) => onChange('linkedin', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="email">Email de contacto</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="contacto@management.com"
          value={formData.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
        />
      </div>
    </div>
  );
};

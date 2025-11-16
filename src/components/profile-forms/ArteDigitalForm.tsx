import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface ArteDigitalFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const ArteDigitalForm = ({ formData, onChange }: ArteDigitalFormProps) => {
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
        <Label htmlFor="bio">Biografía / Portfolio</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Describe tu trabajo y experiencia en arte digital..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="specialties">Especialidades</Label>
        <Input
          id="specialties"
          name="specialties"
          placeholder="Ej: Diseño 3D, Motion Graphics, NFT Art"
          value={formData.specialties || ''}
          onChange={(e) => onChange('specialties', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="portfolio_url">Portfolio URL</Label>
        <Input
          id="portfolio_url"
          name="portfolio_url"
          type="url"
          placeholder="https://tu-portfolio.com"
          value={formData.portfolio_url || ''}
          onChange={(e) => onChange('portfolio_url', e.target.value)}
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
    </div>
  );
};

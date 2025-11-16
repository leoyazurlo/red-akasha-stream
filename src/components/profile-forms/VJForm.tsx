import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface VJFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const VJForm = ({ formData, onChange }: VJFormProps) => {
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
        <Label htmlFor="bio">Biografía / Estilo visual</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Describe tu estilo visual y experiencia como VJ..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="specialties">Especialidades técnicas</Label>
        <Input
          id="specialties"
          name="specialties"
          placeholder="Ej: Resolume, TouchDesigner, Proyección mapping"
          value={formData.specialties || ''}
          onChange={(e) => onChange('specialties', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="venues_produced">Eventos donde has trabajado</Label>
        <Textarea
          id="venues_produced"
          name="venues_produced"
          placeholder="Lista de eventos y venues"
          value={formData.venues_produced || ''}
          onChange={(e) => onChange('venues_produced', e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="portfolio_url">Portfolio / Reel</Label>
        <Input
          id="portfolio_url"
          name="portfolio_url"
          type="url"
          placeholder="https://vimeo.com/tu-portfolio"
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
    </div>
  );
};

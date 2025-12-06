import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface PercusionFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const PercusionForm = ({ formData, onChange }: PercusionFormProps) => {
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
        <Label htmlFor="bio">Biografía / Estilo de percusión</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Describe tu estilo, instrumentos de percusión y experiencia..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="specialties">Instrumentos de percusión</Label>
        <Input
          id="specialties"
          name="specialties"
          placeholder="Ej: Batería, Congas, Cajón, Bongos, Timbales..."
          value={formData.specialties || ''}
          onChange={(e) => onChange('specialties', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="genre">Géneros musicales</Label>
        <Input
          id="genre"
          name="genre"
          placeholder="Ej: Jazz, Salsa, Rock, Folclore..."
          value={formData.genre || ''}
          onChange={(e) => onChange('genre', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="experience_level">Nivel de experiencia</Label>
        <Input
          id="experience_level"
          name="experience_level"
          placeholder="Ej: Profesional, Intermedio, Avanzado..."
          value={formData.experience_level || ''}
          onChange={(e) => onChange('experience_level', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          name="instagram"
          placeholder="@usuario"
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
    </div>
  );
};

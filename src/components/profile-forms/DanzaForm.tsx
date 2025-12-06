import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DanzaFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const danceGenres = [
  { value: "street_dance", label: "Street Dance" },
  { value: "danza_afro", label: "Danza Afro" },
  { value: "pole_dance", label: "Pole Dance" },
  { value: "composiciones_coreograficas", label: "Composiciones Coreográficas" },
  { value: "expresion_corporal", label: "Expresión Corporal" },
  { value: "tango", label: "Tango" },
  { value: "comedia_musical", label: "Comedia Musical" },
  { value: "ballet_clasico", label: "Ballet Clásico" },
];

export const DanzaForm = ({ formData, onChange }: DanzaFormProps) => {
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
        <Label htmlFor="genre">Género de danza *</Label>
        <Select
          value={formData.genre || ''}
          onValueChange={(value) => onChange('genre', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu género de danza" />
          </SelectTrigger>
          <SelectContent>
            {danceGenres.map((genre) => (
              <SelectItem key={genre.value} value={genre.value}>
                {genre.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="bio">Biografía / Trayectoria</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Describe tu trayectoria en la danza, formación y experiencia..."
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="specialties">Especialidades adicionales</Label>
        <Input
          id="specialties"
          name="specialties"
          placeholder="Ej: Coreografía, Dirección artística, Docencia..."
          value={formData.specialties || ''}
          onChange={(e) => onChange('specialties', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="education">Formación</Label>
        <Input
          id="education"
          name="education"
          placeholder="Ej: Academia, escuela, formación profesional..."
          value={formData.education || ''}
          onChange={(e) => onChange('education', e.target.value)}
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

      <div>
        <Label htmlFor="portfolio_url">Portfolio / Showreel</Label>
        <Input
          id="portfolio_url"
          name="portfolio_url"
          placeholder="https://youtube.com/... o enlace a tu portfolio"
          value={formData.portfolio_url || ''}
          onChange={(e) => onChange('portfolio_url', e.target.value)}
        />
      </div>
    </div>
  );
};

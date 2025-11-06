import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";

interface MusicianFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const instruments = [
  "Voz/Canto", "Guitarra", "Bajo", "Batería", "Piano", "Teclado", "Violín",
  "Saxofón", "Trompeta", "Flauta", "Clarinete", "Percusión", "DJ/Productor",
  "Sintetizador", "Acordeón", "Armónica", "Violonchelo", "Contrabajo",
  "Trombón", "Charango", "Bombo", "Bandoneón", "Otros"
];

const musicGenres = [
  "rock", "pop", "jazz", "blues", "reggae", "hip_hop", "rap",
  "electronica", "house", "techno", "trance", "country", "folk",
  "soul", "funk", "rnb", "metal", "punk", "ska", "clasica",
  "opera", "flamenco", "tango", "salsa", "merengue", "cumbia",
  "bachata", "kpop", "jpop", "andina", "celta", "gospel",
  "arabe", "africana", "india"
];

const experienceLevels = [
  { value: "beginner", label: "Principiante (0-2 años)" },
  { value: "intermediate", label: "Intermedio (3-5 años)" },
  { value: "advanced", label: "Avanzado (6-10 años)" },
  { value: "professional", label: "Profesional (10+ años)" },
];

export const MusicianForm = ({ formData, onChange }: MusicianFormProps) => {
  return (
    <div className="space-y-4">
      <ImageUpload
        label="Foto de perfil (cuadrada)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube una imagen cuadrada para tu perfil (formato recomendado: 400x400px)"
        allowLocalPreview={true}
      />

      <div className="space-y-2">
        <Label htmlFor="instrument">Instrumento principal *</Label>
        <Select
          value={formData.instrument || ""}
          onValueChange={(value) => onChange("instrument", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu instrumento" />
          </SelectTrigger>
          <SelectContent>
            {instruments.map((instrument) => (
              <SelectItem key={instrument} value={instrument.toLowerCase().replace(/\//g, '_')}>
                {instrument}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Género musical *</Label>
        <Select
          value={formData.genre || ""}
          onValueChange={(value) => onChange("genre", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el género" />
          </SelectTrigger>
          <SelectContent>
            {musicGenres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1).replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience_level">Nivel de experiencia *</Label>
        <Select
          value={formData.experience_level || ""}
          onValueChange={(value) => onChange("experience_level", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nivel" />
          </SelectTrigger>
          <SelectContent>
            {experienceLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Reseña/Bio (Experiencia y trayectoria) *</Label>
        <Textarea
          id="bio"
          value={formData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Cuéntanos tu trayectoria musical..."
          className="min-h-32"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="education">Formación académica</Label>
        <Input
          id="education"
          value={formData.education || ""}
          onChange={(e) => onChange("education", e.target.value)}
          placeholder="Ej: Conservatorio Nacional, autodidacta..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="available_for">Disponible para</Label>
        <Input
          id="available_for"
          value={formData.available_for || ""}
          onChange={(e) => onChange("available_for", e.target.value)}
          placeholder="Ej: sesiones de grabación, clases, shows en vivo..."
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
            placeholder="contacto@musico.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Videos, audios y galería se podrán agregar después de completar el registro
      </p>
    </div>
  );
};

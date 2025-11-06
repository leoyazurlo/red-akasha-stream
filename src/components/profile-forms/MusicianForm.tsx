import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { Autocomplete } from "@/components/ui/autocomplete";

interface MusicianFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const instruments = [
  { value: "voz_canto", label: "Voz/Canto" },
  { value: "guitarra", label: "Guitarra" },
  { value: "bajo", label: "Bajo" },
  { value: "bateria", label: "Batería" },
  { value: "piano", label: "Piano" },
  { value: "teclado", label: "Teclado" },
  { value: "violin", label: "Violín" },
  { value: "saxofon", label: "Saxofón" },
  { value: "trompeta", label: "Trompeta" },
  { value: "flauta", label: "Flauta" },
  { value: "clarinete", label: "Clarinete" },
  { value: "percusion", label: "Percusión" },
  { value: "dj_productor", label: "DJ/Productor" },
  { value: "sintetizador", label: "Sintetizador" },
  { value: "acordeon", label: "Acordeón" },
  { value: "armonica", label: "Armónica" },
  { value: "violonchelo", label: "Violonchelo" },
  { value: "contrabajo", label: "Contrabajo" },
  { value: "trombon", label: "Trombón" },
  { value: "charango", label: "Charango" },
  { value: "bombo", label: "Bombo" },
  { value: "bandoneon", label: "Bandoneón" },
  { value: "ukulele", label: "Ukelele" },
  { value: "mandolina", label: "Mandolina" },
  { value: "arpa", label: "Arpa" },
  { value: "otros", label: "Otros" },
];

const musicGenres = [
  { value: "rock", label: "Rock" },
  { value: "pop", label: "Pop" },
  { value: "jazz", label: "Jazz" },
  { value: "blues", label: "Blues" },
  { value: "reggae", label: "Reggae" },
  { value: "hip_hop", label: "Hip Hop" },
  { value: "rap", label: "Rap" },
  { value: "electronica", label: "Electrónica" },
  { value: "house", label: "House" },
  { value: "techno", label: "Techno" },
  { value: "trance", label: "Trance" },
  { value: "country", label: "Country" },
  { value: "folk", label: "Folk" },
  { value: "soul", label: "Soul" },
  { value: "funk", label: "Funk" },
  { value: "rnb", label: "R&B" },
  { value: "metal", label: "Metal" },
  { value: "punk", label: "Punk" },
  { value: "ska", label: "Ska" },
  { value: "clasica", label: "Clásica" },
  { value: "opera", label: "Ópera" },
  { value: "flamenco", label: "Flamenco" },
  { value: "tango", label: "Tango" },
  { value: "salsa", label: "Salsa" },
  { value: "merengue", label: "Merengue" },
  { value: "cumbia", label: "Cumbia" },
  { value: "bachata", label: "Bachata" },
  { value: "reggaeton", label: "Reggaeton" },
  { value: "kpop", label: "K-Pop" },
  { value: "jpop", label: "J-Pop" },
  { value: "andina", label: "Andina" },
  { value: "celta", label: "Celta" },
  { value: "gospel", label: "Gospel" },
  { value: "arabe", label: "Árabe" },
  { value: "africana", label: "Africana" },
  { value: "india", label: "India" },
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
        <Autocomplete
          options={instruments}
          value={formData.instrument || ""}
          onValueChange={(value) => onChange("instrument", value)}
          placeholder="Selecciona tu instrumento"
          searchPlaceholder="Buscar instrumento..."
          emptyMessage="No se encontró ese instrumento"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Género musical *</Label>
        <Autocomplete
          options={musicGenres}
          value={formData.genre || ""}
          onValueChange={(value) => onChange("genre", value)}
          placeholder="Selecciona el género musical"
          searchPlaceholder="Buscar género..."
          emptyMessage="No se encontró ese género"
        />
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

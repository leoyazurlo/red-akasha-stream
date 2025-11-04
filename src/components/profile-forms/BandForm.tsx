import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ImageUpload";

interface BandFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const musicGenres = [
  "rock", "pop", "jazz", "blues", "reggae", "hip_hop", "rap",
  "electronica", "house", "techno", "trance", "country", "folk",
  "soul", "funk", "rnb", "metal", "punk", "ska", "clasica",
  "opera", "flamenco", "tango", "salsa", "merengue", "cumbia",
  "bachata", "kpop", "jpop", "andina", "celta", "gospel",
  "arabe", "africana", "india"
];

export const BandForm = ({ formData, onChange }: BandFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información de la agrupación musical</h3>
      
      <ImageUpload
        label="Foto de perfil (cuadrada)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube una imagen cuadrada de la banda (formato recomendado: 400x400px)"
      />

      <div className="space-y-2">
        <Label htmlFor="bandName">Nombre de la banda *</Label>
        <Input
          id="bandName"
          value={formData.display_name || ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="Nombre de la banda"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Estilo musical *</Label>
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
        <Label>Fecha de creación</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.formation_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.formation_date ? format(new Date(formData.formation_date), "PPP") : "Selecciona una fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.formation_date ? new Date(formData.formation_date) : undefined}
              onSelect={(date) => onChange("formation_date", date ? format(date, "yyyy-MM-dd") : null)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Reseña/Bio (historia del proyecto) *</Label>
        <Textarea
          id="bio"
          value={formData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Cuéntanos la historia de la banda..."
          className="min-h-32"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="producerInstagram">Productor (Instagram)</Label>
        <Input
          id="producerInstagram"
          value={formData.producer_instagram || ""}
          onChange={(e) => onChange("producer_instagram", e.target.value)}
          placeholder="@productor"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recordedAt">Grabado o Producido en/por</Label>
        <Input
          id="recordedAt"
          value={formData.recorded_at || ""}
          onChange={(e) => onChange("recorded_at", e.target.value)}
          placeholder="Nombre del estudio o productor"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={formData.instagram || ""}
            onChange={(e) => onChange("instagram", e.target.value)}
            placeholder="@tubanda"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            value={formData.facebook || ""}
            onChange={(e) => onChange("facebook", e.target.value)}
            placeholder="facebook.com/tubanda"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.linkedin || ""}
            onChange={(e) => onChange("linkedin", e.target.value)}
            placeholder="linkedin.com/company/tubanda"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="contacto@banda.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Los integrantes, videos y carretes de fotos se podrán agregar después de completar el registro
      </p>
    </div>
  );
};

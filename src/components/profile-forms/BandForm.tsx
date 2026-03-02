import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ImageUpload";
import { Autocomplete } from "@/components/ui/autocomplete";
import { MUSIC_GENRES } from "@/lib/constants/music";
import { Badge } from "@/components/ui/badge";

interface BandFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const BandForm = ({ formData, onChange }: BandFormProps) => {
  const selectedGenres: string[] = formData.genres || (formData.genre ? [formData.genre] : []);

  const handleAddGenre = (value: string) => {
    if (value && !selectedGenres.includes(value)) {
      const updated = [...selectedGenres, value];
      onChange("genres", updated);
      onChange("genre", updated[0]); // keep primary genre in sync
    }
  };

  const handleRemoveGenre = (value: string) => {
    const updated = selectedGenres.filter((g) => g !== value);
    onChange("genres", updated);
    onChange("genre", updated[0] || "");
  };

  const genreLabel = (value: string) =>
    MUSIC_GENRES.find((g) => g.value === value)?.label || value;

  const availableGenres = MUSIC_GENRES.filter((g) => !selectedGenres.includes(g.value));

  return (
    <div className="space-y-4">
      <ImageUpload
        label="Foto de perfil (cuadrada)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube una imagen cuadrada de la banda (formato recomendado: 400x400px)"
        allowLocalPreview={true}
      />

      <div className="space-y-2">
        <Label htmlFor="genre">Estilos musicales *</Label>
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedGenres.map((g) => (
              <Badge key={g} variant="secondary" className="gap-1 pr-1">
                {genreLabel(g)}
                <button
                  type="button"
                  onClick={() => handleRemoveGenre(g)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Autocomplete
          options={availableGenres.map((g) => ({ value: g.value, label: g.label }))}
          value=""
          onValueChange={handleAddGenre}
          placeholder="Agregar estilo musical..."
          searchPlaceholder="Buscar género..."
          emptyMessage="No se encontró ese género"
        />
        <p className="text-xs text-muted-foreground">Podés seleccionar varios estilos musicales</p>
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

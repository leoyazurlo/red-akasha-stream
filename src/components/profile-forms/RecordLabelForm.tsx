import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ImageUpload";

interface RecordLabelFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const musicGenres = [
  { id: "rock", label: "Rock" },
  { id: "pop", label: "Pop" },
  { id: "jazz", label: "Jazz" },
  { id: "blues", label: "Blues" },
  { id: "reggae", label: "Reggae" },
  { id: "hip_hop", label: "Hip Hop" },
  { id: "rap", label: "Rap" },
  { id: "electronica", label: "Electrónica" },
  { id: "house", label: "House" },
  { id: "techno", label: "Techno" },
  { id: "metal", label: "Metal" },
  { id: "punk", label: "Punk" },
  { id: "indie", label: "Indie" },
  { id: "folk", label: "Folk" },
  { id: "tango", label: "Tango" },
  { id: "cumbia", label: "Cumbia" },
  { id: "salsa", label: "Salsa" },
  { id: "reggaeton", label: "Reggaeton" },
];

export const RecordLabelForm = ({ formData, onChange }: RecordLabelFormProps) => {
  const handleGenreToggle = (genreId: string) => {
    const currentGenres = formData.label_genres || [];
    const updatedGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((g: string) => g !== genreId)
      : [...currentGenres, genreId];
    onChange("label_genres", updatedGenres);
  };

  return (
    <div className="space-y-4">
      <ImageUpload
        label="Logo del sello (cuadrado)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube el logo del sello discográfico (formato recomendado: 400x400px)"
        allowLocalPreview={true}
      />

      <div className="space-y-2">
        <Label htmlFor="display_name">Nombre del sello *</Label>
        <Input
          id="display_name"
          value={formData.display_name || ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="Nombre oficial del sello discográfico"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Año de fundación</Label>
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
              {formData.formation_date ? format(new Date(formData.formation_date), "yyyy") : "Selecciona un año"}
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
        <Label htmlFor="bio">Descripción del sello *</Label>
        <Textarea
          id="bio"
          value={formData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Historia, visión y misión del sello discográfico..."
          className="min-h-32"
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Géneros que representa *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {musicGenres.map((genre) => (
            <div key={genre.id} className="flex items-center space-x-2">
              <Checkbox
                id={genre.id}
                checked={(formData.label_genres || []).includes(genre.id)}
                onCheckedChange={() => handleGenreToggle(genre.id)}
              />
              <Label htmlFor={genre.id} className="font-normal cursor-pointer">
                {genre.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Sitio web oficial</Label>
        <Input
          id="website"
          type="url"
          value={formData.website || ""}
          onChange={(e) => onChange("website", e.target.value)}
          placeholder="https://www.tusello.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="services">Servicios ofrecidos</Label>
        <Textarea
          id="services"
          value={formData.services || ""}
          onChange={(e) => onChange("services", e.target.value)}
          placeholder="Ej: producción, distribución, marketing, eventos..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={formData.instagram || ""}
            onChange={(e) => onChange("instagram", e.target.value)}
            placeholder="@tusello"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            value={formData.facebook || ""}
            onChange={(e) => onChange("facebook", e.target.value)}
            placeholder="facebook.com/tusello"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.linkedin || ""}
            onChange={(e) => onChange("linkedin", e.target.value)}
            placeholder="linkedin.com/company/tusello"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="contacto@sello.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Los artistas representados y catálogo se podrán agregar después de completar el registro
      </p>
    </div>
  );
};

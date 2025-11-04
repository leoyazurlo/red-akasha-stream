import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VenueFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const venueTypes = [
  { value: "teatro", label: "Teatro" },
  { value: "auditorio", label: "Auditorio" },
  { value: "discoteque", label: "Discoteque" },
  { value: "club", label: "Club" },
  { value: "bar", label: "Bar" },
  { value: "anfiteatro", label: "Anfiteatro" }
];

export const VenueForm = ({ formData, onChange }: VenueFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información de la sala de concierto</h3>
      
      <div className="space-y-2">
        <Label htmlFor="avatar_url">Foto de perfil (cuadrada) *</Label>
        <Input
          id="avatar_url"
          value={formData.avatar_url || ""}
          onChange={(e) => onChange("avatar_url", e.target.value)}
          placeholder="URL de la imagen"
          required
        />
        <p className="text-xs text-muted-foreground">Sube una imagen cuadrada de la sala</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueName">Nombre de la sala *</Label>
        <Input
          id="venueName"
          value={formData.display_name || ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="Nombre de la sala"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueType">Estilo de sala *</Label>
        <Select
          value={formData.venue_type || ""}
          onValueChange={(value) => onChange("venue_type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo de sala" />
          </SelectTrigger>
          <SelectContent>
            {venueTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacidad</Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity || ""}
          onChange={(e) => onChange("capacity", parseInt(e.target.value))}
          placeholder="Número de personas"
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
            placeholder="contacto@sala.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Las galerías de fotos y videos se podrán subir después de completar el registro
      </p>
    </div>
  );
};

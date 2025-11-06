import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";

interface MarketingDigitalFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const marketingServices = [
  { id: "seo", label: "SEO (Optimización en buscadores)" },
  { id: "sem", label: "SEM (Publicidad pagada)" },
  { id: "social_media", label: "Gestión de Redes Sociales" },
  { id: "content", label: "Marketing de Contenidos" },
  { id: "email", label: "Email Marketing" },
  { id: "analytics", label: "Analítica y Métricas" },
  { id: "branding", label: "Branding y Diseño" },
  { id: "influencer", label: "Marketing de Influencers" },
  { id: "ecommerce", label: "E-commerce Marketing" },
];

export const MarketingDigitalForm = ({ formData, onChange }: MarketingDigitalFormProps) => {
  const handleServiceToggle = (serviceId: string) => {
    const currentServices = formData.marketing_services || [];
    const updatedServices = currentServices.includes(serviceId)
      ? currentServices.filter((s: string) => s !== serviceId)
      : [...currentServices, serviceId];
    onChange("marketing_services", updatedServices);
  };

  return (
    <div className="space-y-4">
      <ImageUpload
        label="Foto de perfil / Logo (cuadrada)"
        value={formData.avatar_url || ""}
        onChange={(url) => onChange("avatar_url", url)}
        required
        description="Sube una imagen cuadrada para tu perfil (formato recomendado: 400x400px)"
        allowLocalPreview={true}
      />

      <div className="space-y-2">
        <Label htmlFor="bio">Reseña/Bio (Servicios y experiencia) *</Label>
        <Textarea
          id="bio"
          value={formData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Describe tu experiencia en marketing digital..."
          className="min-h-32"
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Servicios ofrecidos *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {marketingServices.map((service) => (
            <div key={service.id} className="flex items-center space-x-2">
              <Checkbox
                id={service.id}
                checked={(formData.marketing_services || []).includes(service.id)}
                onCheckedChange={() => handleServiceToggle(service.id)}
              />
              <Label htmlFor={service.id} className="font-normal cursor-pointer">
                {service.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialties">Especialidades</Label>
        <Input
          id="specialties"
          value={formData.specialties || ""}
          onChange={(e) => onChange("specialties", e.target.value)}
          placeholder="Ej: Industria musical, artistas independientes..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolio_url">Portafolio / Sitio Web</Label>
        <Input
          id="portfolio_url"
          type="url"
          value={formData.portfolio_url || ""}
          onChange={(e) => onChange("portfolio_url", e.target.value)}
          placeholder="https://tuportafolio.com"
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
            placeholder="contacto@marketing.com"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Nota: Casos de éxito y portfolio se podrán agregar después de completar el registro
      </p>
    </div>
  );
};

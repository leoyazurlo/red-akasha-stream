import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Save, MapPin, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Location data
const argentinaProvincias = [
  { name: "Buenos Aires", cities: ["Adolfo Alsina", "La Plata", "Mar del Plata", "Bahía Blanca", "Tandil", "Quilmes", "Lanús", "Avellaneda", "Morón", "Lomas de Zamora"] },
  { name: "Ciudad Autónoma de Buenos Aires", cities: ["CABA"] },
  { name: "Córdoba", cities: ["Córdoba", "Río Cuarto", "Villa María", "Villa Carlos Paz", "Alta Gracia"] },
  { name: "Santa Fe", cities: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista"] },
  { name: "Mendoza", cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Maipú", "Luján de Cuyo"] },
  { name: "Tucumán", cities: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Concepción"] },
  { name: "Entre Ríos", cities: ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay"] },
  { name: "Salta", cities: ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Cafayate"] },
  { name: "Misiones", cities: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú"] },
  { name: "Chaco", cities: ["Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela"] },
  { name: "Corrientes", cities: ["Corrientes", "Goya", "Paso de los Libres"] },
  { name: "Santiago del Estero", cities: ["Santiago del Estero", "La Banda", "Termas de Río Hondo"] },
  { name: "San Juan", cities: ["San Juan", "Rawson", "Chimbas", "Caucete"] },
  { name: "Jujuy", cities: ["San Salvador de Jujuy", "San Pedro de Jujuy", "Perico", "Humahuaca"] },
  { name: "Río Negro", cities: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti"] },
  { name: "Neuquén", cities: ["Neuquén", "San Martín de los Andes", "Zapala", "Villa La Angostura"] },
  { name: "Formosa", cities: ["Formosa", "Clorinda", "Pirané"] },
  { name: "Chubut", cities: ["Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"] },
  { name: "San Luis", cities: ["San Luis", "Villa Mercedes", "La Punta", "Merlo"] },
  { name: "Catamarca", cities: ["San Fernando del Valle de Catamarca", "Andalgalá", "Belén"] },
  { name: "La Rioja", cities: ["La Rioja", "Chilecito", "Chamical"] },
  { name: "La Pampa", cities: ["Santa Rosa", "General Pico", "General Acha"] },
  { name: "Santa Cruz", cities: ["Río Gallegos", "Caleta Olivia", "El Calafate"] },
  { name: "Tierra del Fuego", cities: ["Ushuaia", "Río Grande", "Tolhuin"] },
];

const latinAmericanCountries = [
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Bolivia", flag: "🇧🇴", code: "BO", cities: ["La Paz", "Santa Cruz", "Cochabamba", "Sucre"] },
  { name: "Brasil", flag: "🇧🇷", code: "BR", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"] },
  { name: "Chile", flag: "🇨🇱", code: "CL", cities: ["Santiago", "Valparaíso", "Concepción", "Viña del Mar"] },
  { name: "Colombia", flag: "🇨🇴", code: "CO", cities: ["Bogotá", "Medellín", "Cali", "Barranquilla"] },
  { name: "México", flag: "🇲🇽", code: "MX", cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla"] },
  { name: "Perú", flag: "🇵🇪", code: "PE", cities: ["Lima", "Arequipa", "Trujillo", "Cusco"] },
  { name: "Uruguay", flag: "🇺🇾", code: "UY", cities: ["Montevideo", "Salto", "Paysandú", "Maldonado"] },
  { name: "Venezuela", flag: "🇻🇪", code: "VE", cities: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto"] },
  { name: "Ecuador", flag: "🇪🇨", code: "EC", cities: ["Quito", "Guayaquil", "Cuenca"] },
  { name: "Paraguay", flag: "🇵🇾", code: "PY", cities: ["Asunción", "Ciudad del Este", "San Lorenzo"] },
];

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "Agrupación Musical",
  sala_concierto: "Sala de Concierto",
  estudio_grabacion: "Estudio de Grabación",
  productor_artistico: "Productor Artístico",
  promotor_artistico: "Promotor Artístico",
  productor_audiovisual: "Productor Audiovisual",
  musico: "Músico",
  dj: "DJ",
  vj: "VJ",
  sello_discografico: "Sello Discográfico",
  management: "Management",
  representante: "Representante",
  marketing_digital: "Marketing Digital",
  contenido: "Creador de Contenido",
  perfil_contenido: "Creador de Contenido",
  arte_digital: "Arte Digital",
  percusion: "Percusión",
  danza: "Danza",
  melomano: "Melómano"
};

const profileTypeOptions = [
  { value: "agrupacion_musical", label: "Agrupación Musical" },
  { value: "arte_digital", label: "Arte Digital" },
  { value: "danza", label: "Danza" },
  { value: "dj", label: "DJ" },
  { value: "estudio_grabacion", label: "Estudio de Grabación" },
  { value: "management", label: "Management" },
  { value: "marketing_digital", label: "Marketing Digital" },
  { value: "musico", label: "Músico" },
  { value: "percusion", label: "Percusión" },
  { value: "productor_artistico", label: "Productor Artístico" },
  { value: "productor_audiovisual", label: "Productor Audiovisual" },
  { value: "promotor_artistico", label: "Promotor Artístico" },
  { value: "representante", label: "Representante" },
  { value: "sala_concierto", label: "Sala de Concierto" },
  { value: "sello_discografico", label: "Sello Discográfico" },
  { value: "perfil_contenido", label: "Creador de Contenido" },
  { value: "vj", label: "VJ" }
];

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    pais: "",
    provincia: "",
    ciudad: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    whatsapp: "",
    telefono: "",
    email: "",
    profile_type: "",
    additional_profile_types: [] as string[]
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profile_details")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          navigate("/asociate");
          return;
        }
        throw profileError;
      }

      setFormData({
        display_name: profileData.display_name || "",
        bio: profileData.bio || "",
        avatar_url: profileData.avatar_url || "",
        pais: profileData.pais || "",
        provincia: profileData.provincia || "",
        ciudad: profileData.ciudad || "",
        instagram: profileData.instagram || "",
        facebook: profileData.facebook || "",
        linkedin: profileData.linkedin || "",
        whatsapp: profileData.whatsapp || "",
        telefono: profileData.telefono || "",
        email: profileData.email || "",
        profile_type: profileData.profile_type || "",
        additional_profile_types: (profileData as any).additional_profile_types || []
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar tu perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileTypeToggle = (profileValue: string, checked: boolean) => {
    // The main profile_type cannot be changed, only additional ones
    if (profileValue === formData.profile_type) return;
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        additional_profile_types: [...prev.additional_profile_types, profileValue]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        additional_profile_types: prev.additional_profile_types.filter(p => p !== profileValue)
      }));
    }
  };

  // Get all selected profile types (main + additional)
  const allSelectedTypes = useMemo(() => {
    const types = [formData.profile_type, ...formData.additional_profile_types];
    return [...new Set(types.filter(Boolean))];
  }, [formData.profile_type, formData.additional_profile_types]);

  const cityOptions = useMemo(() => {
    if (!formData.pais) return [];
    
    if (formData.pais === "Argentina") {
      const provincia = argentinaProvincias.find(p => p.name === formData.provincia);
      return provincia?.cities.map(city => ({ value: city, label: city })) || [];
    } else {
      const country = latinAmericanCountries.find(c => c.name === formData.pais);
      return country?.cities?.map(city => ({ value: city, label: city })) || [];
    }
  }, [formData.pais, formData.provincia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.display_name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (!formData.ciudad.trim()) {
      toast({
        title: "Error",
        description: "La ciudad es obligatoria",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profile_details")
        .update({
          display_name: formData.display_name.trim(),
          bio: formData.bio.trim() || null,
          avatar_url: formData.avatar_url || null,
          pais: formData.pais,
          provincia: formData.provincia || null,
          ciudad: formData.ciudad,
          instagram: formData.instagram.trim() || null,
          facebook: formData.facebook.trim() || null,
          linkedin: formData.linkedin.trim() || null,
          whatsapp: formData.whatsapp.trim() || null,
          telefono: formData.telefono.trim() || null,
          email: formData.email.trim() || null,
          additional_profile_types: formData.additional_profile_types,
          updated_at: new Date().toISOString()
        } as any)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "¡Perfil actualizado!",
        description: "Los cambios se guardaron correctamente"
      });
      
      navigate("/mi-perfil");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/mi-perfil")}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mi Perfil
          </Button>

          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
            Editar Perfil
          </h1>

          <form onSubmit={handleSubmit}>
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle>Información del Perfil</CardTitle>
                <CardDescription>
                  Actualiza tu información. Los campos con * son obligatorios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Types Selection */}
                <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div>
                    <Label className="font-semibold">Tipos de Perfil</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecciona todos los tipos que te representen. Tu tipo principal está marcado.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profileTypeOptions.map((option) => {
                      const isMainType = option.value === formData.profile_type;
                      const isSelected = isMainType || formData.additional_profile_types.includes(option.value);
                      
                      return (
                        <label
                          key={option.value}
                          htmlFor={`profile-${option.value}`}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isMainType
                              ? 'border-primary bg-primary/20 cursor-default'
                              : isSelected
                                ? 'border-primary/60 bg-primary/10'
                                : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            id={`profile-${option.value}`}
                            checked={isSelected}
                            disabled={isMainType}
                            onCheckedChange={(checked) => handleProfileTypeToggle(option.value, !!checked)}
                          />
                          <span className="text-sm font-medium flex-1">
                            {option.label}
                            {isMainType && (
                              <span className="ml-2 text-xs text-primary">(Principal)</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  
                  {allSelectedTypes.length > 1 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                      <span className="text-sm text-muted-foreground">Seleccionados:</span>
                      {allSelectedTypes.map(type => (
                        <span
                          key={type}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            type === formData.profile_type 
                              ? 'bg-primary/30 text-primary' 
                              : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {profileTypeLabels[type] || type}
                          {type !== formData.profile_type && (
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleProfileTypeToggle(type, false)}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="space-y-2">
                  <ImageUpload
                    label="Foto de Perfil"
                    value={formData.avatar_url}
                    onChange={(url) => handleChange("avatar_url", url)}
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="display_name">Nombre / Nombre Artístico *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleChange("display_name", e.target.value)}
                    placeholder="Tu nombre o nombre artístico"
                    className="bg-background/50"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    placeholder="Cuéntanos sobre ti..."
                    className="bg-background/50 min-h-[120px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bio.length}/1000
                  </p>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-4 h-4" />
                    <Label className="font-semibold">Ubicación</Label>
                  </div>
                  
                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="pais">País *</Label>
                    <Select 
                      value={formData.pais} 
                      onValueChange={(value) => {
                        handleChange("pais", value);
                        handleChange("provincia", "");
                        handleChange("ciudad", "");
                      }}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Selecciona un país" />
                      </SelectTrigger>
                      <SelectContent>
                        {latinAmericanCountries.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.flag} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Province (for Argentina only) */}
                  {formData.pais === "Argentina" && (
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Provincia</Label>
                      <Select 
                        value={formData.provincia} 
                        onValueChange={(value) => {
                          handleChange("provincia", value);
                          handleChange("ciudad", "");
                        }}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecciona una provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {argentinaProvincias.map((prov) => (
                            <SelectItem key={prov.name} value={prov.name}>
                              {prov.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    {cityOptions.length > 0 ? (
                      <Autocomplete
                        options={cityOptions}
                        value={formData.ciudad}
                        onValueChange={(value) => handleChange("ciudad", value)}
                        placeholder="Busca o escribe tu ciudad"
                      />
                    ) : (
                      <Input
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => handleChange("ciudad", e.target.value)}
                        placeholder="Tu ciudad"
                        className="bg-background/50"
                      />
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <Label className="font-semibold">Información de Contacto</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de contacto</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="email@ejemplo.com"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => handleChange("telefono", e.target.value)}
                        placeholder="+54 11 1234-5678"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleChange("whatsapp", e.target.value)}
                        placeholder="+54 11 1234-5678"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <Label className="font-semibold">Redes Sociales</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => handleChange("instagram", e.target.value)}
                        placeholder="@tu_usuario"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) => handleChange("facebook", e.target.value)}
                        placeholder="facebook.com/tu_pagina"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => handleChange("linkedin", e.target.value)}
                        placeholder="linkedin.com/in/tu_perfil"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => navigate("/mi-perfil")}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/80"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>

                {/* Important Notice */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-red-500">🔒 Aviso importante</span>
                    <br />
                    <span className="text-cyan-400">
                      En Red Akasha.org confiamos en la buena fe de nuestra comunidad. Al registrarte, comprometete a que tus datos personales sean reales, completos y fehacientes. Tu sinceridad fortalece la transparencia, la confianza y el espíritu colaborativo que nos une.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditarPerfil;

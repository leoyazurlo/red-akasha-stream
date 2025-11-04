import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Users, Zap, Globe, Award } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MusicLoverForm } from "@/components/profile-forms/MusicLoverForm";
import { RecordingStudioForm } from "@/components/profile-forms/RecordingStudioForm";
import { VenueForm } from "@/components/profile-forms/VenueForm";
import { ProducerForm } from "@/components/profile-forms/ProducerForm";
import { PromoterForm } from "@/components/profile-forms/PromoterForm";
import { BandForm } from "@/components/profile-forms/BandForm";

const argentinaProvincias = [
  { name: "Buenos Aires", cities: ["La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Lanús", "Banfield", "Lomas de Zamora", "San Isidro", "Avellaneda", "San Martín", "Tandil", "Olavarría", "Azul", "Necochea", "Pergamino"] },
  { name: "Ciudad Autónoma de Buenos Aires", cities: ["CABA"] },
  { name: "Catamarca", cities: ["San Fernando del Valle de Catamarca", "Andalgalá", "Belén", "Tinogasta"] },
  { name: "Chaco", cities: ["Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Barranqueras"] },
  { name: "Chubut", cities: ["Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel", "Rawson"] },
  { name: "Córdoba", cities: ["Córdoba", "Río Cuarto", "Villa María", "San Francisco", "Villa Carlos Paz", "Alta Gracia", "Bell Ville"] },
  { name: "Corrientes", cities: ["Corrientes", "Goya", "Paso de los Libres", "Curuzú Cuatiá", "Mercedes"] },
  { name: "Entre Ríos", cities: ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Victoria"] },
  { name: "Formosa", cities: ["Formosa", "Clorinda", "Pirané", "El Colorado"] },
  { name: "Jujuy", cities: ["San Salvador de Jujuy", "San Pedro de Jujuy", "Libertador General San Martín", "Perico", "Humahuaca"] },
  { name: "La Pampa", cities: ["Santa Rosa", "General Pico", "General Acha", "Realicó"] },
  { name: "La Rioja", cities: ["La Rioja", "Chilecito", "Chamical", "Aimogasta"] },
  { name: "Mendoza", cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Maipú", "Luján de Cuyo", "San Martín", "Tunuyán"] },
  { name: "Misiones", cities: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Apóstoles", "Leandro N. Alem"] },
  { name: "Neuquén", cities: ["Neuquén", "San Martín de los Andes", "Zapala", "Cutral-Có", "Villa La Angostura", "Centenario"] },
  { name: "Río Negro", cities: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Villa Regina"] },
  { name: "Salta", cities: ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Metán", "Cafayate"] },
  { name: "San Juan", cities: ["San Juan", "Rawson", "Chimbas", "Pocito", "Caucete", "Rivadavia"] },
  { name: "San Luis", cities: ["San Luis", "Villa Mercedes", "La Punta", "Merlo", "Justo Daract"] },
  { name: "Santa Cruz", cities: ["Río Gallegos", "Caleta Olivia", "Pico Truncado", "Puerto Deseado", "El Calafate"] },
  { name: "Santa Fe", cities: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista", "San Lorenzo"] },
  { name: "Santiago del Estero", cities: ["Santiago del Estero", "La Banda", "Termas de Río Hondo", "Frías", "Añatuya"] },
  { name: "Tierra del Fuego", cities: ["Ushuaia", "Río Grande", "Tolhuin"] },
  { name: "Tucumán", cities: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Concepción", "Aguilares", "Monteros"] }
];

const latinAmericanCountries = [
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Bolivia", flag: "🇧🇴", code: "BO", cities: ["La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro", "Potosí"] },
  { name: "Brasil", flag: "🇧🇷", code: "BR", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Curitiba", "Recife"] },
  { name: "Chile", flag: "🇨🇱", code: "CL", cities: ["Santiago", "Valparaíso", "Concepción", "Viña del Mar", "Antofagasta", "Temuco"] },
  { name: "Colombia", flag: "🇨🇴", code: "CO", cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira"] },
  { name: "Costa Rica", flag: "🇨🇷", code: "CR", cities: ["San José", "Alajuela", "Cartago", "Heredia", "Limón", "Puntarenas"] },
  { name: "Cuba", flag: "🇨🇺", code: "CU", cities: ["La Habana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara"] },
  { name: "Ecuador", flag: "🇪🇨", code: "EC", cities: ["Quito", "Guayaquil", "Cuenca", "Ambato", "Manta", "Machala"] },
  { name: "El Salvador", flag: "🇸🇻", code: "SV", cities: ["San Salvador", "Santa Ana", "San Miguel", "Soyapango"] },
  { name: "Guatemala", flag: "🇬🇹", code: "GT", cities: ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango"] },
  { name: "Honduras", flag: "🇭🇳", code: "HN", cities: ["Tegucigalpa", "San Pedro Sula", "La Ceiba", "Choloma"] },
  { name: "México", flag: "🇲🇽", code: "MX", cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Cancún"] },
  { name: "Nicaragua", flag: "🇳🇮", code: "NI", cities: ["Managua", "León", "Granada", "Masaya", "Matagalpa"] },
  { name: "Panamá", flag: "🇵🇦", code: "PA", cities: ["Ciudad de Panamá", "Colón", "David", "Santiago"] },
  { name: "Paraguay", flag: "🇵🇾", code: "PY", cities: ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Encarnación"] },
  { name: "Perú", flag: "🇵🇪", code: "PE", cities: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Cusco", "Piura"] },
  { name: "República Dominicana", flag: "🇩🇴", code: "DO", cities: ["Santo Domingo", "Santiago", "La Romana", "San Pedro de Macorís"] },
  { name: "Uruguay", flag: "🇺🇾", code: "UY", cities: ["Montevideo", "Salto", "Paysandú", "Maldonado", "Rivera"] },
  { name: "Venezuela", flag: "🇻🇪", code: "VE", cities: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"] },
];

const Asociate = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    provincia: "",
    ciudad: "",
    // Campos del perfil específico
    avatar_url: "",
    display_name: "",
    bio: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    whatsapp: "",
    technical_specs: "",
    map_location: "",
    venue_type: "",
    capacity: "",
    genre: "",
    formation_date: "",
    producer_instagram: "",
    recorded_at: "",
  });

  const perfilOptions = [
    { value: "disfruto_musica", label: "Disfruto de la música" },
    { value: "productor_artistico", label: "Productor artístico" },
    { value: "estudio_grabacion", label: "Estudio de grabación" },
    { value: "promotor_artistico", label: "Promotor artístico" },
    { value: "sala_concierto", label: "Sala de concierto" },
    { value: "agrupacion_musical", label: "Agrupación musical" }
  ];

  const profileTypeMap: Record<string, string> = {
    "disfruto_musica": "disfruto_musica",
    "productor_artistico": "productor_artistico",
    "estudio_grabacion": "estudio_grabacion",
    "promotor_artistico": "promotor_artistico",
    "sala_concierto": "sala_concierto",
    "agrupacion_musical": "agrupacion_musical"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProfile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un tipo de perfil",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para completar el registro",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos específicos del perfil
      const profileData: any = {
        user_id: user.id,
        profile_type: profileTypeMap[selectedProfile],
        avatar_url: formData.avatar_url,
        display_name: formData.display_name || formData.nombre,
        bio: formData.bio || null,
        pais: formData.pais,
        provincia: formData.provincia || null,
        ciudad: formData.ciudad,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        linkedin: formData.linkedin || null,
        email: formData.email || user.email,
        telefono: formData.telefono || null,
        whatsapp: formData.whatsapp || null,
      };

      // Agregar campos específicos según el tipo de perfil
      if (selectedProfile === "estudio_grabacion") {
        profileData.technical_specs = formData.technical_specs ? JSON.stringify({ description: formData.technical_specs }) : null;
        profileData.map_location = formData.map_location || null;
      } else if (selectedProfile === "sala_concierto") {
        profileData.venue_type = formData.venue_type || null;
        profileData.capacity = formData.capacity ? parseInt(formData.capacity) : null;
      } else if (selectedProfile === "agrupacion_musical") {
        profileData.genre = formData.genre || null;
        profileData.formation_date = formData.formation_date || null;
        profileData.producer_instagram = formData.producer_instagram || null;
        profileData.recorded_at = formData.recorded_at || null;
      }

      // Guardar en profile_details
      const { error } = await supabase
        .from('profile_details')
        .insert(profileData);

      if (error) throw error;
      
      setSubmitted(true);
      toast({
        title: "¡Perfil creado exitosamente!",
        description: "Ahora puedes subir contenido y completar tu perfil.",
      });
    } catch (error: any) {
      console.error('Error al crear perfil:', error);
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear tu perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfileFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderProfileForm = () => {
    switch (selectedProfile) {
      case "disfruto_musica":
        return <MusicLoverForm formData={formData} onChange={handleProfileFieldChange} />;
      case "estudio_grabacion":
        return <RecordingStudioForm formData={formData} onChange={handleProfileFieldChange} />;
      case "sala_concierto":
        return <VenueForm formData={formData} onChange={handleProfileFieldChange} />;
      case "productor_artistico":
        return <ProducerForm formData={formData} onChange={handleProfileFieldChange} />;
      case "promotor_artistico":
        return <PromoterForm formData={formData} onChange={handleProfileFieldChange} />;
      case "agrupacion_musical":
        return <BandForm formData={formData} onChange={handleProfileFieldChange} />;
      default:
        return null;
    }
  };

  const benefits = [
    {
      icon: Users,
      title: "Comunidad Global",
      description: "Conecta con artistas y creadores de todo el mundo"
    },
    {
      icon: Zap,
      title: "Acceso Exclusivo",
      description: "Contenido, eventos y recursos exclusivos para miembros"
    },
    {
      icon: Globe,
      title: "Plataforma Digital",
      description: "Espacio para compartir y monetizar tu contenido"
    },
    {
      icon: Award,
      title: "Reconocimiento",
      description: "Visibilidad y oportunidades de colaboración"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <CosmicBackground />
      <Header />
      
      <main className="relative pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-light mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Únete a la Red Akasha
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Forma parte de una comunidad global de artistas, creadores y visionarios
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <benefit.icon className="w-10 h-10 text-primary mb-4" />
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Registration Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Solicitud de Inscripción</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8 animate-fade-in">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">¡Gracias por tu interés!</h3>
                    <p className="text-muted-foreground">
                      Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        required
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+54 9 11 1234-5678"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pais">País *</Label>
                      <Select
                        value={formData.pais}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value, provincia: "", ciudad: "" }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent>
                          {latinAmericanCountries.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              <span className="flex items-center gap-2">
                                <span className="text-xl">{country.flag}</span>
                                {country.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.pais === "Argentina" && (
                      <div className="space-y-2">
                        <Label htmlFor="provincia">Provincia *</Label>
                        <Select
                          value={formData.provincia}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, provincia: value, ciudad: "" }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu provincia" />
                          </SelectTrigger>
                          <SelectContent>
                            {argentinaProvincias.map((provincia) => (
                              <SelectItem key={provincia.name} value={provincia.name}>
                                {provincia.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.pais && (formData.pais !== "Argentina" || formData.provincia) && (
                      <div className="space-y-2">
                        <Label htmlFor="ciudad">Ciudad *</Label>
                        <Select
                          value={formData.ciudad}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, ciudad: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.pais === "Argentina" 
                              ? argentinaProvincias
                                  .find(p => p.name === formData.provincia)
                                  ?.cities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  ))
                              : latinAmericanCountries
                                  .find(c => c.name === formData.pais)
                                  ?.cities?.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                     )}

                     <div className="space-y-2">
                       <Label htmlFor="profileType">Selecciona tu perfil *</Label>
                       <Select
                         value={selectedProfile}
                         onValueChange={(value) => setSelectedProfile(value)}
                         required
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="¿Cuál es tu perfil?" />
                         </SelectTrigger>
                         <SelectContent>
                           {perfilOptions.map((option) => (
                             <SelectItem key={option.value} value={option.value}>
                               {option.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>

                     {selectedProfile && (
                       <div className="border-t pt-6">
                         {renderProfileForm()}
                       </div>
                     )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Solicitud"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Asociate;

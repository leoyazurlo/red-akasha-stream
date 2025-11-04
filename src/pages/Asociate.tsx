import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    pais: "",
    provincia: "",
    ciudad: "",
    motivacion: "",
    areasInteres: [] as string[],
    queBuscas: [] as string[],
    perfil: [] as string[],
  });

  const perfilOptions = [
    "Disfruto de la música",
    "Productor artístico",
    "Estudio de grabación",
    "Promotor artístico",
    "Sala de concierto",
    "Agrupación musical"
  ];

  const areasInteresOptions = [
    "Música",
    "Video",
    "Programas",
    "Cine",
    "Podcasts",
    "Arte digital",
    "Fotografía"
  ];

  const queBuscasOptions = [
    "Contacto con productores",
    "Contacto con promotores locales",
    "Contacto con venues o salas de conciertos",
    "Conocer nuevos artistas",
    "Aprender sobre producción",
    "Soy entusiasta del arte"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtener el usuario actual si está autenticado
      const { data: { user } } = await supabase.auth.getUser();

      // Guardar en la tabla de solicitudes de registro
      const { error } = await supabase
        .from('registration_requests')
        .insert({
          user_id: user?.id || null,
          email: formData.email,
          nombre: formData.nombre,
          telefono: formData.telefono || null,
          pais: formData.pais,
          provincia: formData.provincia || null,
          ciudad: formData.ciudad,
          motivacion: formData.motivacion,
          areas_interes: formData.areasInteres,
          que_buscas: formData.queBuscas,
          perfil: formData.perfil,
          status: 'pending'
        });

      if (error) throw error;
      
      setSubmitted(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Pronto nos pondremos en contacto contigo.",
      });
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Intenta de nuevo.",
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

  const handleCheckboxChange = (category: 'areasInteres' | 'queBuscas' | 'perfil', value: string) => {
    setFormData(prev => {
      const currentArray = prev[category];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [category]: newArray
      };
    });
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

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Elige tu perfil</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perfilOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`perfil-${option}`}
                              checked={formData.perfil.includes(option)}
                              onCheckedChange={() => handleCheckboxChange('perfil', option)}
                            />
                            <Label
                              htmlFor={`perfil-${option}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Áreas de interés</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {areasInteresOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`area-${option}`}
                              checked={formData.areasInteres.includes(option)}
                              onCheckedChange={() => handleCheckboxChange('areasInteres', option)}
                            />
                            <Label
                              htmlFor={`area-${option}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Tus intereses en la plataforma:</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {queBuscasOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`busca-${option}`}
                              checked={formData.queBuscas.includes(option)}
                              onCheckedChange={() => handleCheckboxChange('queBuscas', option)}
                            />
                            <Label
                              htmlFor={`busca-${option}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivacion">¿Por qué quieres unirte a Red Akasha? *</Label>
                      <Textarea
                        id="motivacion"
                        name="motivacion"
                        required
                        value={formData.motivacion}
                        onChange={handleChange}
                        placeholder="Cuéntanos sobre tus motivaciones y expectativas..."
                        className="min-h-32"
                      />
                    </div>

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

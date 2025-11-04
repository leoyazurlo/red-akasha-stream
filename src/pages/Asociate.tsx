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

const latinAmericanCountries = [
  { name: "Argentina", code: "AR" },
  { name: "Bolivia", code: "BO" },
  { name: "Brasil", code: "BR" },
  { name: "Chile", code: "CL" },
  { name: "Colombia", code: "CO" },
  { name: "Costa Rica", code: "CR" },
  { name: "Cuba", code: "CU" },
  { name: "Ecuador", code: "EC" },
  { name: "El Salvador", code: "SV" },
  { name: "Guatemala", code: "GT" },
  { name: "Honduras", code: "HN" },
  { name: "México", code: "MX" },
  { name: "Nicaragua", code: "NI" },
  { name: "Panamá", code: "PA" },
  { name: "Paraguay", code: "PY" },
  { name: "Perú", code: "PE" },
  { name: "República Dominicana", code: "DO" },
  { name: "Uruguay", code: "UY" },
  { name: "Venezuela", code: "VE" },
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
    ciudad: "",
    motivacion: "",
    areasInteres: [] as string[],
    queBuscas: [] as string[],
    perfil: [] as string[],
  });

  const areasInteresOptions = [
    "Música",
    "Arte Digital",
    "Fotografía",
    "Video",
    "Podcasts"
  ];

  const queBuscasOptions = [
    "Contacto con productores de mi país",
    "Contacto con salas de grabación",
    "Contacto con venues o salas de concierto",
    "Conocer nuevos artistas"
  ];

  const perfilOptions = [
    "Soy músico",
    "Soy productor",
    "Soy sala de ensayo",
    "Soy sala de concierto"
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
                        onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent>
                          {latinAmericanCountries.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad *</Label>
                      <Input
                        id="ciudad"
                        name="ciudad"
                        required
                        value={formData.ciudad}
                        onChange={handleChange}
                        placeholder="Buenos Aires"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Áreas de Interés</Label>
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
                      <Label className="text-base font-semibold">¿Qué buscas en la plataforma?</Label>
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

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Tu perfil</Label>
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

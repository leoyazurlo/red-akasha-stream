import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Users, Zap, Globe, Award } from "lucide-react";

const Asociate = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    ciudad: "",
    motivacion: "",
    intereses: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aquí se puede guardar en una tabla de registros o enviar por email
      // Por ahora solo mostramos un mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular envío
      
      setSubmitted(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Pronto nos pondremos en contacto contigo.",
      });
    } catch (error) {
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
                      <Label htmlFor="ciudad">Ciudad/País *</Label>
                      <Input
                        id="ciudad"
                        name="ciudad"
                        required
                        value={formData.ciudad}
                        onChange={handleChange}
                        placeholder="Buenos Aires, Argentina"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intereses">Áreas de Interés</Label>
                      <Input
                        id="intereses"
                        name="intereses"
                        value={formData.intereses}
                        onChange={handleChange}
                        placeholder="Música, Arte Digital, Fotografía..."
                      />
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

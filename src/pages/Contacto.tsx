import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, MessageSquare, Send, Sparkles } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es muy largo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muy largo"),
  asunto: z.string().trim().min(3, "El asunto debe tener al menos 3 caracteres").max(150, "El asunto es muy largo"),
  mensaje: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000, "El mensaje es muy largo"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contacto = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = contactSchema.parse(formData);
      
      // Simulate sending (you can integrate with an edge function later)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "¡Mensaje enviado!",
        description: "Gracias por contactarnos. Te responderemos pronto.",
      });

      // Reset form
      setFormData({ nombre: "", email: "", asunto: "", mensaje: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "Hubo un problema al enviar el mensaje. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <CosmicBackground />
      <div className="relative z-10">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <section className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(180_100%_50%/0.5)]">
                  Contacto
                </h1>
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ¿Tienes alguna pregunta, sugerencia o quieres ser parte de Red Akasha? 
                Escríbenos y te responderemos lo antes posible.
              </p>
            </section>

            {/* Contact Form */}
            <section className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div 
                  className="relative p-8 rounded-2xl bg-card/30 backdrop-blur-xl border-2 border-cyan-400/60 
                    shadow-[0_0_40px_hsl(180_100%_50%/0.3),0_0_80px_hsl(180_100%_50%/0.15),inset_0_1px_0_hsl(180_100%_50%/0.2)]
                    hover:shadow-[0_0_60px_hsl(180_100%_50%/0.4),0_0_120px_hsl(180_100%_50%/0.2),inset_0_1px_0_hsl(180_100%_50%/0.3)]
                    transition-all duration-500"
                >
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl" />

                  {/* Floating orbs for Akasha effect */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
                  <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-cyan-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />

                  <div className="space-y-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        Nombre completo
                      </Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        placeholder="Tu nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className={`bg-background/50 border-border focus:border-cyan-400 focus:ring-cyan-400/20 transition-all ${
                          errors.nombre ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.nombre && (
                        <p className="text-red-400 text-sm">{errors.nombre}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        Correo electrónico
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={`bg-background/50 border-border focus:border-cyan-400 focus:ring-cyan-400/20 transition-all ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm">{errors.email}</p>
                      )}
                    </div>

                    {/* Asunto */}
                    <div className="space-y-2">
                      <Label htmlFor="asunto" className="text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        Asunto
                      </Label>
                      <Input
                        id="asunto"
                        name="asunto"
                        type="text"
                        placeholder="¿Sobre qué quieres hablar?"
                        value={formData.asunto}
                        onChange={handleChange}
                        className={`bg-background/50 border-border focus:border-cyan-400 focus:ring-cyan-400/20 transition-all ${
                          errors.asunto ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.asunto && (
                        <p className="text-red-400 text-sm">{errors.asunto}</p>
                      )}
                    </div>

                    {/* Mensaje */}
                    <div className="space-y-2">
                      <Label htmlFor="mensaje" className="text-foreground flex items-center gap-2">
                        <Send className="w-4 h-4 text-cyan-400" />
                        Mensaje
                      </Label>
                      <Textarea
                        id="mensaje"
                        name="mensaje"
                        placeholder="Escribe tu mensaje aquí..."
                        rows={6}
                        value={formData.mensaje}
                        onChange={handleChange}
                        className={`bg-background/50 border-border focus:border-cyan-400 focus:ring-cyan-400/20 transition-all resize-none ${
                          errors.mensaje ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.mensaje && (
                        <p className="text-red-400 text-sm">{errors.mensaje}</p>
                      )}
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.mensaje.length}/2000 caracteres
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 
                        hover:from-cyan-400 hover:to-cyan-500 text-white border-0
                        shadow-[0_0_20px_hsl(180_100%_50%/0.4)] hover:shadow-[0_0_30px_hsl(180_100%_50%/0.6)]
                        transition-all duration-300 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Enviar mensaje
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Additional info */}
              <div className="mt-12 text-center">
                <p className="text-muted-foreground text-sm">
                  También puedes encontrarnos en nuestras redes sociales o escribirnos directamente a{" "}
                  <a 
                    href="mailto:contacto@redakasha.org" 
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
                  >
                    contacto@redakasha.org
                  </a>
                </p>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Contacto;

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, Clock, CheckCircle2, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations/password";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";

// Schema para login (menos restrictivo)
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

// Schema para registro paso 1
const signupStep1Schema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Schema para registro paso 2 (perfil)
const signupStep2Schema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  telefono: z.string().optional(),
  pais: z.string().min(1, "Selecciona un país"),
  ciudad: z.string().min(1, "Ingresa tu ciudad"),
  motivacion: z.string().min(20, "Cuéntanos un poco más sobre ti (mínimo 20 caracteres)"),
  perfil: z.array(z.string()).min(1, "Selecciona al menos un tipo de perfil"),
  avatar_url: z.string().min(1, "La foto de perfil es obligatoria"),
});

const latinAmericanCountries = [
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Bolivia", flag: "🇧🇴" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Cuba", flag: "🇨🇺" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "El Salvador", flag: "🇸🇻" },
  { name: "Guatemala", flag: "🇬🇹" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "México", flag: "🇲🇽" },
  { name: "Nicaragua", flag: "🇳🇮" },
  { name: "Panamá", flag: "🇵🇦" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Perú", flag: "🇵🇪" },
  { name: "República Dominicana", flag: "🇩🇴" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "España", flag: "🇪🇸" },
  { name: "Otro", flag: "🌎" },
];

const perfilOptions = [
  { value: "amante_de_la_musica", label: "Amante de la música" },
  { value: "agrupacion_musical", label: "Agrupación musical / Banda" },
  { value: "arte_digital", label: "Arte digital" },
  { value: "danza", label: "Danza" },
  { value: "dj", label: "DJ" },
  { value: "estudio_grabacion", label: "Estudio de grabación" },
  { value: "management", label: "Management" },
  { value: "marketing_digital", label: "Marketing digital" },
  { value: "musico", label: "Músico" },
  { value: "percusion", label: "Percusión" },
  { value: "productor_artistico", label: "Productor artístico" },
  { value: "productor_audiovisual", label: "Productor audiovisual" },
  { value: "promotor_artistico", label: "Promotor artístico" },
  { value: "representante", label: "Representante" },
  { value: "sala_concierto", label: "Sala de concierto / Venue" },
  { value: "sello_discografico", label: "Sello discográfico" },
  { value: "vj", label: "VJ" },
];

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Read tab from URL parameter
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  
  // Multi-step signup
  const [signupStep, setSignupStep] = useState(1);
  const [signupSubmitted, setSignupSubmitted] = useState(false);
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    telefono: "",
    pais: "",
    provincia: "",
    ciudad: "",
    motivacion: "",
    perfil: [] as string[],
    avatar_url: "",
  });

  // Usar useEffect para redirección en lugar de hacerlo durante render
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si hay usuario, no renderizar (se está redirigiendo)
  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = loginSchema.parse(loginData);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Hubo un problema al iniciar sesión.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupStep1Schema.parse({
        email: signupData.email,
        password: signupData.password,
        confirmPassword: signupData.confirmPassword,
      });
      
      // Check if email already exists
      const { data: existingRequests } = await supabase
        .from('registration_requests')
        .select('id, status')
        .eq('email', signupData.email.toLowerCase())
        .limit(1);
        
      if (existingRequests && existingRequests.length > 0) {
        const request = existingRequests[0];
        if (request.status === 'pending') {
          toast({
            title: "Solicitud en proceso",
            description: "Ya tienes una solicitud pendiente de aprobación. Por favor espera 1-2 días hábiles.",
            variant: "destructive",
          });
          return;
        }
      }
      
      setSignupStep(2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleSignupStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      signupStep2Schema.parse({
        nombre: signupData.nombre,
        telefono: signupData.telefono,
        pais: signupData.pais,
        ciudad: signupData.ciudad,
        motivacion: signupData.motivacion,
        perfil: signupData.perfil,
        avatar_url: signupData.avatar_url,
      });
      
      // Upload avatar if it's a base64 image
      let avatarUrl = signupData.avatar_url;
      if (signupData.avatar_url && signupData.avatar_url.startsWith('data:image/')) {
        try {
          const base64Response = await fetch(signupData.avatar_url);
          const blob = await base64Response.blob();
          
          const fileExt = blob.type.split('/')[1];
          const fileName = `pending/${Date.now()}-avatar.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-avatars')
            .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('profile-avatars')
              .getPublicUrl(uploadData.path);
            avatarUrl = publicUrl;
          }
        } catch (uploadError) {
          console.error('Error processing avatar:', uploadError);
        }
      }
      
      // Create registration request (pending approval)
      const { error: insertError } = await supabase
        .from('registration_requests')
        .insert({
          email: signupData.email.toLowerCase(),
          nombre: signupData.nombre,
          telefono: signupData.telefono || null,
          pais: signupData.pais,
          provincia: signupData.provincia || null,
          ciudad: signupData.ciudad,
          motivacion: signupData.motivacion,
          perfil: signupData.perfil,
          status: 'pending',
          encrypted_password: signupData.password,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
      
      setSignupSubmitted(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud está siendo revisada por nuestro equipo.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Hubo un problema al enviar tu solicitud.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileToggle = (value: string, checked: boolean) => {
    setSignupData(prev => ({
      ...prev,
      perfil: checked 
        ? [...prev.perfil, value]
        : prev.perfil.filter(p => p !== value)
    }));
  };

  const renderSignupForm = () => {
    if (signupSubmitted) {
      return (
        <div className="text-center py-8 animate-fade-in space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ¡Solicitud recibida!
            </h3>
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-muted-foreground">
                Tu solicitud de registro está siendo revisada por nuestro equipo de administradores.
              </p>
              
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Tiempo estimado de espera</span>
                </div>
                <p className="text-2xl font-bold text-primary">1 a 2 días hábiles</p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2 text-left p-4 bg-muted/30 rounded-lg">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Este proceso garantiza la <strong>veracidad de cada usuario</strong> y mantiene la calidad de nuestra comunidad.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Recibirás un email de confirmación cuando tu perfil sea aprobado.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Una vez aprobado, podrás iniciar sesión con tu email y contraseña.</span>
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSignupStep(1);
              setSignupSubmitted(false);
              setSignupData({
                email: "",
                password: "",
                confirmPassword: "",
                nombre: "",
                telefono: "",
                pais: "",
                provincia: "",
                ciudad: "",
                motivacion: "",
                perfil: [],
                avatar_url: "",
              });
            }}
          >
            Volver al inicio
          </Button>
        </div>
      );
    }

    if (signupStep === 1) {
      return (
        <form onSubmit={handleSignupStep1} className="space-y-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
              <span>Paso 1 de 2 - Datos de acceso</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email *</Label>
            <Input
              id="signup-email"
              type="email"
              required
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Contraseña *</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showSignupPassword ? "text" : "password"}
                required
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={signupData.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirmar contraseña *</Label>
            <div className="relative">
              <Input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                placeholder="Repite tu contraseña"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
              <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            Continuar al perfil
          </Button>
        </form>
      );
    }

    // Step 2 - Profile form
    return (
      <form onSubmit={handleSignupStep2} className="space-y-5">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</span>
            <span>Paso 2 de 2 - Tu perfil</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => setSignupStep(1)}
          className="mb-2"
        >
          ← Volver al paso anterior
        </Button>

        {/* Avatar */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">Foto de perfil *</Label>
          </div>
          <ImageUpload
            label=""
            value={signupData.avatar_url}
            onChange={(url) => setSignupData(prev => ({ ...prev, avatar_url: url }))}
            required
            allowLocalPreview={true}
            description="Sube una foto clara de tu rostro o logo"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              required
              value={signupData.nombre}
              onChange={(e) => setSignupData({ ...signupData, nombre: e.target.value })}
              placeholder="Tu nombre artístico o real"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input
              id="telefono"
              type="tel"
              value={signupData.telefono}
              onChange={(e) => setSignupData({ ...signupData, telefono: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">País *</Label>
            <Select 
              value={signupData.pais} 
              onValueChange={(value) => setSignupData({ ...signupData, pais: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent>
                {latinAmericanCountries.map((country) => (
                  <SelectItem key={country.name} value={country.name}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ciudad">Ciudad *</Label>
            <Input
              id="ciudad"
              required
              value={signupData.ciudad}
              onChange={(e) => setSignupData({ ...signupData, ciudad: e.target.value })}
              placeholder="Tu ciudad"
            />
          </div>
        </div>

        {/* Profile types */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">¿Qué tipo de perfil te describe? *</Label>
          <p className="text-xs text-muted-foreground">Puedes seleccionar varios</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
            {perfilOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-all text-sm ${
                  signupData.perfil.includes(option.value)
                    ? 'bg-primary/10 border border-primary'
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <Checkbox
                  checked={signupData.perfil.includes(option.value)}
                  onCheckedChange={(checked) => handleProfileToggle(option.value, !!checked)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div className="space-y-2">
          <Label htmlFor="motivacion">Cuéntanos sobre ti y qué buscas en Red Akasha *</Label>
          <Textarea
            id="motivacion"
            required
            value={signupData.motivacion}
            onChange={(e) => setSignupData({ ...signupData, motivacion: e.target.value })}
            placeholder="Describe tu actividad artística, tus proyectos y qué esperas encontrar en nuestra comunidad..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Mínimo 20 caracteres ({signupData.motivacion.length}/20)
          </p>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-sm">
          <p className="text-foreground">
            <strong>Importante:</strong> Tu solicitud será revisada por nuestro equipo para garantizar la veracidad de los perfiles. 
            Este proceso puede tomar entre <strong className="text-primary">1 a 2 días hábiles</strong>.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando solicitud...
            </>
          ) : (
            "Enviar solicitud de registro"
          )}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <CosmicBackground />
      <Header />
      
      <main className="relative pt-24 pb-16 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Red Akasha
            </h1>
            <p className="text-muted-foreground text-lg font-medium">¡Únete a nuestra comunidad!</p>
          </div>

          <div className="text-center mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-foreground leading-relaxed">
              Para ver y hacer uso de la base de datos de La Red Akasha debes asociarte gratis con un perfil de usuario consumidor o creador. <span className="font-semibold text-primary">¡Elige tu perfil!</span>
            </p>
          </div>

          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Autenticación</CardTitle>
              <CardDescription>
                Inicia sesión o crea una cuenta nueva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.5)] text-primary font-semibold"
                  >
                    Asociarse
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          placeholder="••••••"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Iniciando sesión...
                        </>
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  {renderSignupForm()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;

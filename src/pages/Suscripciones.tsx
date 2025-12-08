import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Check, Calendar, CreditCard, Heart, Globe, Music, Users, Sparkles, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface UserSubscription {
  id: string;
  plan_type: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
}

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Colaborador Mensual',
    price: 5,
    currency: 'USD',
    period: 'mes',
    icon: Heart,
    features: [
      'Acceso anticipado a contenido exclusivo',
      'Tu nombre en los créditos de apoyo',
      'Notificaciones de nuevos lanzamientos',
      'Badge de colaborador en el foro'
    ]
  },
  {
    id: 'annual',
    name: 'Colaborador Anual',
    price: 50,
    currency: 'USD',
    period: 'año',
    icon: Star,
    highlighted: true,
    savings: '2 meses gratis',
    features: [
      'Todo lo del plan mensual',
      'Acceso a eventos virtuales exclusivos',
      'Menciones especiales en streams',
      'Votación en decisiones de la plataforma',
      'Badge dorado de colaborador VIP'
    ]
  }
];

const Suscripciones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para suscribirte",
        variant: "destructive"
      });
      return;
    }

    setSubscribing(planId);
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) return;

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planId,
          status: 'active',
          amount: plan.price,
          currency: plan.currency,
          payment_method: 'card',
          payment_provider: 'manual',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (planId === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu apoyo!",
        description: "Tu suscripción ha sido activada. Juntos hacemos crecer Red Akasha.",
      });

      fetchSubscription();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la suscripción. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({
        title: "Suscripción cancelada",
        description: "Lamentamos verte partir. Mantendrás acceso hasta el fin del período actual.",
      });

      setSubscription(null);
    } catch (error) {
      console.error('Error cancelling:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la suscripción.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-LA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Hero Section - Emotional Appeal */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">Para colaboradores fuera de Latinoamérica</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sé Parte del Cambio
              </span>
            </h1>
            
            <div className="max-w-3xl mx-auto space-y-4 text-lg text-muted-foreground">
              <p>
                <strong className="text-foreground">Red Akasha es un sueño compartido.</strong> Una plataforma creada por artistas, 
                para artistas, donde la música y el arte latinoamericano pueden brillar sin fronteras.
              </p>
              <p>
                Mientras que para Latinoamérica este proyecto es de <span className="text-cyan-400 font-semibold">libre uso</span>, 
                necesitamos el apoyo de quienes están más allá de nuestras fronteras para seguir creciendo.
              </p>
            </div>
          </div>

          {/* What Your Support Does */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              <Heart className="inline-block w-6 h-6 mr-2 text-pink-500" />
              ¿En qué invertiremos tu apoyo?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <Music className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
                  <CardTitle className="text-lg">Producción de Contenido</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  Documentales sobre artistas emergentes, sesiones en vivo, podcasts y material educativo 
                  que celebre la riqueza cultural de Latinoamérica.
                </CardContent>
              </Card>
              
              <Card className="border-purple-500/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                  <CardTitle className="text-lg">Mejoras en la Plataforma</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  Nuevas funcionalidades, mejor infraestructura, apps móviles y herramientas que 
                  faciliten la conexión entre artistas y audiencias.
                </CardContent>
              </Card>
              
              <Card className="border-pink-500/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-pink-400" />
                  <CardTitle className="text-lg">Comunidad y Eventos</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  Festivales virtuales, encuentros entre artistas, talleres y becas para 
                  músicos emergentes que merecen ser escuchados.
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Current Subscription */}
          {user && subscription && (
            <Card className="mb-12 border-2 border-cyan-400/40 shadow-[0_0_30px_hsl(180_100%_50%/0.2)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-cyan-400" />
                  Tu Suscripción Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                        {subscription.plan_type === 'annual' ? 'Colaborador Anual' : 'Colaborador Mensual'}
                      </Badge>
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Activa
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Próxima renovación: {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {formatPrice(subscription.amount, subscription.currency)}/{subscription.plan_type === 'annual' ? 'año' : 'mes'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive"
                    onClick={handleCancel}
                  >
                    Darse de Baja
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans */}
          {!subscription && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-center mb-8">Elige tu forma de colaborar</h2>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <Card 
                      key={plan.id}
                      className={`relative overflow-hidden transition-all hover:scale-105 ${
                        plan.highlighted 
                          ? 'border-2 border-cyan-400 shadow-[0_0_40px_hsl(180_100%_50%/0.3)]' 
                          : 'border-border/50'
                      }`}
                    >
                      {plan.highlighted && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                          {plan.savings}
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-2">
                        <Icon className={`w-12 h-12 mx-auto mb-3 ${plan.highlighted ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          <span className="text-3xl font-bold text-foreground">
                            {formatPrice(plan.price, plan.currency)}
                          </span>
                          <span className="text-muted-foreground">/{plan.period}</span>
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <Button 
                          className={`w-full ${
                            plan.highlighted 
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600' 
                              : ''
                          }`}
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={subscribing === plan.id}
                        >
                          {subscribing === plan.id ? 'Procesando...' : 'Comenzar a Colaborar'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emotional Closing */}
          <div className="text-center max-w-2xl mx-auto py-12 border-t border-border/30">
            <p className="text-lg italic text-muted-foreground mb-4">
              "Cada suscripción es un voto de confianza en el arte latinoamericano. 
              No estás pagando por un servicio, estás invirtiendo en un movimiento cultural."
            </p>
            <p className="text-sm text-cyan-400">
              — El equipo de Red Akasha
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mt-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h3>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Puedo darme de baja en cualquier momento?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sí, puedes cancelar tu suscripción cuando quieras. Mantendrás el acceso y beneficios hasta el final de tu período de facturación actual. Sin preguntas, sin complicaciones.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Por qué es gratis para Latinoamérica?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Creemos que el acceso a la cultura no debe tener barreras económicas. Red Akasha nació para empoderar a los artistas latinoamericanos, por eso es de libre uso en la región. Tu apoyo desde el exterior hace posible esta misión.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Qué métodos de pago aceptan?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Aceptamos tarjetas de crédito/débito (Visa, Mastercard, Amex), PayPal y transferencias internacionales. Estamos trabajando para agregar más opciones pronto.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Suscripciones;
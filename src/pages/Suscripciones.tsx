import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Check, Calendar, Heart, Globe, Sparkles, Gift } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
    name: 'Mensual',
    price: 5,
    currency: 'USD',
    period: 'mes',
    features: [
      'Uso y descarga del contenido disponible',
      'Acceso anticipado a contenido',
      'Badge de colaborador',
      'Tu nombre en créditos'
    ]
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 50,
    currency: 'USD',
    period: 'año',
    highlighted: true,
    savings: '2 meses gratis',
    features: [
      'Todo lo del plan mensual',
      'Eventos virtuales exclusivos',
      'Badge dorado VIP',
      'Voto en decisiones'
    ]
  }
];

const Suscripciones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donating, setDonating] = useState(false);

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
        description: "Tu suscripción ha sido activada.",
      });

      fetchSubscription();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la suscripción.",
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
        description: "Mantendrás acceso hasta el fin del período actual.",
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleDonate = async () => {
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor ingresa un monto válido mayor a 0",
        variant: "destructive"
      });
      return;
    }

    setDonating(true);
    try {
      // Aquí se integraría con el procesador de pagos
      // Por ahora simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "¡Gracias por tu donación!",
        description: `Tu donación de $${amount.toFixed(2)} USD ayudará a Red Akasha a seguir creciendo.`,
      });
      
      setDonationOpen(false);
      setDonationAmount("");
    } catch (error) {
      console.error('Error processing donation:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la donación.",
        variant: "destructive"
      });
    } finally {
      setDonating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Hero Section */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-glow opacity-20 pointer-events-none" />
            
            <CardContent className="relative p-8 text-center">
              <Badge className="mb-4 px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_hsl(180_100%_50%/0.3)]">
                <Globe className="w-3 h-3 mr-1" />
                Para colaboradores fuera de Latinoamérica
              </Badge>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                Sé Parte del Cambio
              </h1>
              
              <div className="max-w-2xl mx-auto space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Red Akasha es un sueño compartido.</strong> Una plataforma creada por artistas, 
                  para artistas, donde la música y el arte latinoamericano pueden brillar sin fronteras.
                </p>
                <p>
                  Mientras que para Latinoamérica este proyecto es de <span className="text-primary font-semibold">libre uso</span>, 
                  necesitamos el apoyo de quienes están más allá de nuestras fronteras para seguir creciendo.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What Your Support Does */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-accent" />
              ¿En qué invertiremos tu apoyo?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Producción de Contenido</h3>
                  <p className="text-sm text-muted-foreground">
                    Documentales sobre artistas emergentes, sesiones en vivo, podcasts y material educativo 
                    que celebre la riqueza cultural de Latinoamérica.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-6 text-center">
                  <Crown className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                  <h3 className="font-semibold mb-2">Mejoras en la Plataforma</h3>
                  <p className="text-sm text-muted-foreground">
                    Nuevas funcionalidades, mejor infraestructura, apps móviles y herramientas que 
                    faciliten la conexión entre artistas y audiencias.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold mb-2">Comunidad y Eventos</h3>
                  <p className="text-sm text-muted-foreground">
                    Festivales virtuales, encuentros entre artistas, talleres y becas para 
                    músicos emergentes que merecen ser escuchados.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Current Subscription */}
          {user && subscription && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-2 border-primary/40 shadow-glow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {subscription.plan_type === 'annual' ? 'Colaborador Anual' : 'Colaborador Mensual'}
                        </span>
                        <Badge variant="outline" className="text-green-500 border-green-500 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Activa
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Renueva: {format(new Date(subscription.current_period_end), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
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
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                    plan.highlighted 
                      ? 'border-2 border-primary/60 shadow-glow' 
                      : 'border-primary/20'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                      {plan.savings}
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90' : ''}`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? 'Procesando...' : 'Colaborar'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Donation Banner */}
          <button
            onClick={() => setDonationOpen(true)}
            className="w-full mb-8 py-4 px-6 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-background font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_30px_hsl(180_100%_50%/0.4)] hover:shadow-[0_0_40px_hsl(180_100%_50%/0.6)] hover:scale-[1.02]"
          >
            <Gift className="w-6 h-6" />
            DONAR
          </button>

          {/* Donation Dialog */}
          <Dialog open={donationOpen} onOpenChange={setDonationOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-cyan-400" />
                  Hacer una Donación
                </DialogTitle>
                <DialogDescription>
                  Tu donación ayuda a mantener Red Akasha como un proyecto de libre uso para Latinoamérica.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto a donar (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="10.00"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
                
                {/* Quick amounts */}
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setDonationAmount(amount.toString())}
                      className={donationAmount === amount.toString() ? 'border-cyan-400 text-cyan-400' : ''}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                
                <Button 
                  onClick={handleDonate}
                  disabled={donating || !donationAmount}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-background"
                >
                  {donating ? 'Procesando...' : 'Confirmar Donación'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quote */}
          <Card className="bg-card/30 backdrop-blur-sm border-primary/10">
            <CardContent className="p-6 text-center">
              <p className="italic text-muted-foreground mb-2">
                "Cada suscripción es un voto de confianza en el arte latinoamericano."
              </p>
              <p className="text-xs text-primary">— El equipo de Red Akasha</p>
            </CardContent>
          </Card>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Suscripciones;
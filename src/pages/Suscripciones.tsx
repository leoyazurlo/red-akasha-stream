import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Check, Calendar, Heart, Globe, Sparkles, Gift, CreditCard, Wallet, Bitcoin, Building2, Loader2, Lock } from "lucide-react";
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

interface PaymentMethod {
  id: string;
  provider: string;
  display_name: string;
  icon_name: string;
  is_active: boolean;
  supported_currencies: string[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  savings?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'credit-card': <CreditCard className="w-6 h-6" />,
  'wallet': <Wallet className="w-6 h-6" />,
  'paypal': <Wallet className="w-6 h-6 text-blue-500" />,
  'bitcoin': <Bitcoin className="w-6 h-6 text-orange-500" />,
  'building-2': <Building2 className="w-6 h-6" />,
};

const Suscripciones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Donation state
  const [donationOpen, setDonationOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationStep, setDonationStep] = useState<'amount' | 'payment'>('amount');
  
  // Subscription state
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  // Payment state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    fetchSubscriptionPlans();
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_payment_settings')
        .select('*')
        .in('setting_key', ['subscription_monthly', 'subscription_annual']);

      if (error) throw error;

      const plans: SubscriptionPlan[] = [];
      
      const monthlyData = data?.find(d => d.setting_key === 'subscription_monthly');
      const annualData = data?.find(d => d.setting_key === 'subscription_annual');

      if (monthlyData) {
        const value = monthlyData.setting_value as Record<string, any>;
        plans.push({
          id: 'monthly',
          name: 'Mensual',
          price: value.price || 5,
          currency: 'USD',
          period: 'mes',
          features: [
            'Uso y descarga del contenido disponible',
            'Acceso anticipado a contenido',
            'Badge de colaborador',
            'Tu nombre en créditos'
          ]
        });
      }

      if (annualData) {
        const value = annualData.setting_value as Record<string, any>;
        plans.push({
          id: 'annual',
          name: 'Anual',
          price: value.price || 50,
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
        });
      }

      // Default plans if none found in DB
      if (plans.length === 0) {
        plans.push(
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
        );
      }

      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

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

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods_config')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPaymentMethods(data || []);
      if (data && data.length > 0) {
        setSelectedMethod(data[0].provider);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const openSubscriptionDialog = (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para suscribirte",
        variant: "destructive"
      });
      return;
    }
    setSelectedPlan(plan);
    setSubscriptionOpen(true);
    fetchPaymentMethods();
  };

  const handleSubscribe = async () => {
    if (!user || !selectedPlan || !selectedMethod) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: selectedPlan.id,
          status: 'active',
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          payment_method: selectedMethod,
          payment_provider: selectedMethod,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (selectedPlan.id === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu apoyo!",
        description: "Tu suscripción ha sido activada.",
      });

      setSubscriptionOpen(false);
      setSelectedPlan(null);
      fetchSubscription();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la suscripción.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
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

  const openDonationPayment = () => {
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor ingresa un monto válido mayor a 0",
        variant: "destructive"
      });
      return;
    }
    setDonationStep('payment');
    fetchPaymentMethods();
  };

  const handleDonate = async () => {
    if (!selectedMethod) {
      toast({
        title: "Selecciona un método",
        description: "Debes seleccionar un método de pago",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(donationAmount);
    setProcessing(true);
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "¡Gracias por tu donación!",
        description: `Tu donación de $${amount.toFixed(2)} USD ayudará a Red Akasha a seguir creciendo.`,
      });
      
      setDonationOpen(false);
      setDonationAmount("");
      setDonationStep('amount');
    } catch (error) {
      console.error('Error processing donation:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la donación.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const PaymentMethodsGrid = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Selecciona método de pago
      </h4>
      {loadingMethods ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <Card 
              key={method.provider}
              className={`cursor-pointer transition-all duration-200 hover:border-cyan-400/60 ${
                selectedMethod === method.provider 
                  ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_hsl(180_100%_50%/0.2)]' 
                  : 'border-border'
              }`}
              onClick={() => setSelectedMethod(method.provider)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === method.provider 
                    ? 'bg-cyan-400/20 text-cyan-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {ICON_MAP[method.icon_name] || <CreditCard className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{method.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.provider === 'mercadopago' && 'Latinoamérica'}
                    {method.provider === 'stripe' && 'Visa, Mastercard, Amex'}
                    {method.provider === 'paypal' && 'Cuenta PayPal'}
                    {method.provider === 'crypto' && 'BTC, ETH, USDT'}
                    {method.provider === 'bank_transfer' && 'Transferencia directa'}
                  </p>
                </div>
                {selectedMethod === method.provider && (
                  <Check className="w-5 h-5 text-cyan-400" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main id="main-content" className="relative z-10 pt-24 pb-16">
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

          {/* Royalties Distribution Banner */}
          <Card className="mb-8 bg-black border-2 border-cyan-400 shadow-[0_0_20px_hsl(180_100%_50%/0.4),0_0_40px_hsl(180_100%_50%/0.2)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 text-center">
                <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
                <p className="text-white font-medium text-sm md:text-base">
                  <span className="text-cyan-400 font-bold">Lo recaudado se distribuye:</span> una parte para el mantenimiento y crecimiento de la plataforma, 
                  y otra parte destinada a <span className="text-cyan-400 font-bold">regalías para los creadores de contenido destacados</span>.
                </p>
                <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          {!subscription && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {subscriptionPlans.map((plan) => (
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
                      onClick={() => openSubscriptionDialog(plan)}
                    >
                      Colaborar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Donation Banner */}
          <button
            onClick={() => {
              setDonationOpen(true);
              setDonationStep('amount');
            }}
            className="w-full mb-8 py-4 px-6 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-background font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_30px_hsl(180_100%_50%/0.4)] hover:shadow-[0_0_40px_hsl(180_100%_50%/0.6)] hover:scale-[1.02]"
          >
            <Gift className="w-6 h-6" />
            DONAR
          </button>

          {/* Subscription Payment Dialog */}
          <Dialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  Suscripción {selectedPlan?.name}
                </DialogTitle>
                <DialogDescription>
                  Completa tu suscripción de forma segura
                </DialogDescription>
              </DialogHeader>
              
              {selectedPlan && (
                <div className="space-y-6 py-4">
                  {/* Plan Summary */}
                  <Card className="bg-card/50 border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Plan {selectedPlan.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Facturación {selectedPlan.id === 'annual' ? 'anual' : 'mensual'}
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-cyan-400">
                          {formatPrice(selectedPlan.price, selectedPlan.currency)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <PaymentMethodsGrid />

                  {/* Pay Button */}
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total a pagar:</span>
                      <span className="text-cyan-400">{formatPrice(selectedPlan.price, selectedPlan.currency)}</span>
                    </div>

                    <Button 
                      onClick={handleSubscribe}
                      disabled={!selectedMethod || processing}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Pagar {formatPrice(selectedPlan.price, selectedPlan.currency)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Al realizar el pago aceptas nuestros términos y condiciones.
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Donation Dialog */}
          <Dialog open={donationOpen} onOpenChange={(open) => {
            setDonationOpen(open);
            if (!open) {
              setDonationStep('amount');
              setDonationAmount("");
            }
          }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-cyan-400" />
                  {donationStep === 'amount' ? 'Hacer una Donación' : 'Método de Pago'}
                </DialogTitle>
                <DialogDescription>
                  {donationStep === 'amount' 
                    ? 'Tu donación ayuda a mantener Red Akasha como un proyecto de libre uso para Latinoamérica.'
                    : `Donación de ${formatPrice(parseFloat(donationAmount) || 0, 'USD')}`
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {donationStep === 'amount' ? (
                  <>
                    {/* Amount Input */}
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
                      onClick={openDonationPayment}
                      disabled={!donationAmount || parseFloat(donationAmount) <= 0}
                      className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-background"
                    >
                      Continuar al Pago
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Donation Summary */}
                    <Card className="bg-card/50 border-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Donación</h4>
                            <p className="text-sm text-muted-foreground">Único pago</p>
                          </div>
                          <span className="text-2xl font-bold text-cyan-400">
                            {formatPrice(parseFloat(donationAmount) || 0, 'USD')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <PaymentMethodsGrid />

                    {/* Pay Button */}
                    <div className="border-t pt-4 space-y-4">
                      <Button 
                        onClick={handleDonate}
                        disabled={!selectedMethod || processing}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Donar {formatPrice(parseFloat(donationAmount) || 0, 'USD')}
                          </>
                        )}
                      </Button>

                      <Button 
                        variant="ghost" 
                        onClick={() => setDonationStep('amount')}
                        className="w-full"
                      >
                        Volver
                      </Button>
                    </div>
                  </>
                )}
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
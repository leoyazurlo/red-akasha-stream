import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { SubscriptionPlans } from "@/components/payment/SubscriptionPlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Check, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserSubscription {
  id: string;
  plan_type: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
}

const Suscripciones = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getPlanLabel = (planType: string) => {
    switch (planType) {
      case 'basic': return 'Básico';
      case 'premium': return 'Premium';
      case 'vip': return 'VIP';
      default: return planType;
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
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
                        {getPlanLabel(subscription.plan_type)}
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
                      {formatPrice(subscription.amount, subscription.currency)}/mes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Cambiar Plan
                    </Button>
                    <Button variant="ghost" className="text-destructive hover:text-destructive">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans */}
          <SubscriptionPlans onSubscribe={() => fetchSubscription()} />

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h3>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Puedo cancelar en cualquier momento?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sí, puedes cancelar tu suscripción en cualquier momento. Mantendrás el acceso hasta el final de tu período de facturación actual.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Qué métodos de pago aceptan?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Aceptamos tarjetas de crédito/débito (Visa, Mastercard, Amex), MercadoPago, PayPal, criptomonedas y transferencias bancarias.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">¿Puedo cambiar de plan?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sí, puedes actualizar o bajar de plan en cualquier momento. Los cambios se aplicarán en tu próximo ciclo de facturación.
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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Crown, 
  Star, 
  Zap, 
  Check, 
  Loader2,
  Sparkles
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'vip';
  price: number;
  currency: string;
  features: string[];
  highlighted?: boolean;
  icon: React.ReactNode;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    type: 'basic',
    price: 4.99,
    currency: 'USD',
    icon: <Star className="w-8 h-8" />,
    features: [
      'Acceso a contenido exclusivo básico',
      'Sin anuncios',
      'Calidad HD',
      'Ver en 1 dispositivo',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    type: 'premium',
    price: 9.99,
    currency: 'USD',
    highlighted: true,
    icon: <Crown className="w-8 h-8" />,
    features: [
      'Todo lo de Básico',
      'Acceso a TODO el contenido premium',
      'Calidad 4K Ultra HD',
      'Ver en 3 dispositivos',
      'Descargas offline',
      'Acceso anticipado a estrenos',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    type: 'vip',
    price: 19.99,
    currency: 'USD',
    icon: <Zap className="w-8 h-8" />,
    features: [
      'Todo lo de Premium',
      'Acceso VIP a eventos en vivo',
      'Meet & greet virtuales',
      'Contenido behind-the-scenes',
      'Badge VIP en el foro',
      'Soporte prioritario 24/7',
      'Sin límite de dispositivos',
    ],
  },
];

interface SubscriptionPlansProps {
  onSubscribe?: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlans = ({ onSubscribe }: SubscriptionPlansProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-LA', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para suscribirte",
        variant: "destructive",
      });
      return;
    }

    setLoading(plan.id);
    try {
      // Calculate period end (1 month from now)
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: plan.type,
          payment_method: 'stripe', // Default, would be selected in real implementation
          payment_provider: 'stripe',
          amount: plan.price,
          currency: plan.currency,
          status: 'active',
          current_period_end: periodEnd.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "¡Suscripción activada!",
        description: `Ahora eres miembro ${plan.name}`,
      });

      onSubscribe?.(plan);
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu suscripción. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Planes de Suscripción
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Accede a todo el contenido premium de Red Akasha con nuestros planes mensuales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative transition-all duration-300 hover:scale-105 ${
              plan.highlighted 
                ? 'border-2 border-cyan-400 shadow-[0_0_30px_hsl(180_100%_50%/0.3)]' 
                : 'border-border'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Más Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pt-8">
              <div className={`mx-auto mb-4 p-4 rounded-full ${
                plan.highlighted 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {plan.icon}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-muted-foreground">/mes</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                      plan.highlighted ? 'text-cyan-400' : 'text-green-500'
                    }`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
                className={`w-full ${
                  plan.highlighted 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600' 
                    : ''
                }`}
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  `Suscribirse a ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Cancela en cualquier momento. Sin compromiso a largo plazo.
      </p>
    </div>
  );
};

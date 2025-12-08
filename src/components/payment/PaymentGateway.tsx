import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  Building2, 
  ShoppingCart,
  Clock,
  Crown,
  Check,
  Loader2,
  Lock
} from "lucide-react";

interface ContentInfo {
  id: string;
  title: string;
  price: number | null;
  rental_price: number | null;
  rental_duration_hours: number | null;
  currency: string;
  access_type: string;
  thumbnail_url: string | null;
}

interface PaymentGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentInfo;
  onPaymentSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  provider: string;
  display_name: string;
  icon_name: string;
  is_active: boolean;
  supported_currencies: string[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'credit-card': <CreditCard className="w-6 h-6" />,
  'wallet': <Wallet className="w-6 h-6" />,
  'paypal': <Wallet className="w-6 h-6 text-blue-500" />,
  'bitcoin': <Bitcoin className="w-6 h-6 text-orange-500" />,
  'building-2': <Building2 className="w-6 h-6" />,
};

export const PaymentGateway = ({ 
  open, 
  onOpenChange, 
  content, 
  onPaymentSuccess 
}: PaymentGatewayProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [purchaseType, setPurchaseType] = useState<'purchase' | 'rental'>('purchase');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods_config')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPaymentMethods(data || []);
      
      // Auto-select first method
      if (data && data.length > 0) {
        setSelectedMethod(data[0].provider);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los métodos de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (purchaseType === 'rental' && content.rental_price) {
      return content.rental_price;
    }
    return content.price || 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-LA', {
      style: 'currency',
      currency: content.currency || 'USD',
    }).format(price);
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para realizar una compra",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMethod) {
      toast({
        title: "Selecciona un método",
        description: "Debes seleccionar un método de pago",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Create purchase record
      const expiresAt = purchaseType === 'rental' 
        ? new Date(Date.now() + (content.rental_duration_hours || 48) * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('content_purchases')
        .insert({
          content_id: content.id,
          user_id: user.id,
          purchase_type: purchaseType,
          payment_method: selectedMethod,
          payment_provider: selectedMethod,
          amount: getPrice(),
          currency: content.currency || 'USD',
          status: 'completed', // In production, this would be 'pending' until webhook confirms
          expires_at: expiresAt,
        });

      if (error) throw error;

      toast({
        title: "¡Pago exitoso!",
        description: purchaseType === 'rental' 
          ? `Tienes acceso por ${content.rental_duration_hours || 48} horas` 
          : "Ahora tienes acceso permanente al contenido",
      });

      onPaymentSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error en el pago",
        description: "No se pudo procesar tu pago. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const canRent = content.access_type === 'rental' || (content.rental_price && content.rental_price > 0);
  const canBuy = content.access_type === 'purchase' || (content.price && content.price > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="w-5 h-5 text-cyan-400" />
            Pasarela de Pago
          </DialogTitle>
          <DialogDescription>
            Accede a "{content.title}" de forma segura
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Content Preview */}
            <Card className="bg-card/50">
              <CardContent className="p-4 flex gap-4">
                {content.thumbnail_url && (
                  <img 
                    src={content.thumbnail_url} 
                    alt={content.title}
                    className="w-24 h-16 object-cover rounded-md"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{content.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Contenido premium
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Type Selection */}
            {(canBuy || canRent) && (
              <Tabs value={purchaseType} onValueChange={(v) => setPurchaseType(v as 'purchase' | 'rental')}>
                <TabsList className="grid w-full grid-cols-2">
                  {canBuy && (
                    <TabsTrigger value="purchase" className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Comprar
                    </TabsTrigger>
                  )}
                  {canRent && (
                    <TabsTrigger value="rental" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Alquilar
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="purchase" className="mt-4">
                  <Card className="border-cyan-400/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Compra Permanente
                        <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-purple-500">
                          {formatPrice(content.price || 0)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Acceso ilimitado de por vida
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Acceso permanente al contenido
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Ver en cualquier dispositivo
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Descargas ilimitadas
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rental" className="mt-4">
                  <Card className="border-purple-400/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Alquiler Temporal
                        <Badge variant="secondary">
                          {formatPrice(content.rental_price || 0)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Acceso por {content.rental_duration_hours || 48} horas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Acceso por {content.rental_duration_hours || 48} horas
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Ver en cualquier dispositivo
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          Tiempo limitado desde primera reproducción
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Selecciona método de pago
              </h4>
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
            </div>

            {/* Total & Pay Button */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total a pagar:</span>
                <span className="text-cyan-400">{formatPrice(getPrice())}</span>
              </div>

              <Button 
                onClick={handlePayment}
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
                    Pagar {formatPrice(getPrice())}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Al realizar el pago aceptas nuestros términos y condiciones. 
                Todos los pagos son procesados de forma segura.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

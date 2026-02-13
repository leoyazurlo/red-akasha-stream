import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ShoppingCart, 
  Clock, 
  Crown, 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  Building2,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MonetizationSectionProps {
  isFree: boolean;
  price: string;
  currency: string;
  contentType?: string;
  accessType?: string;
  rentalPrice?: string;
  rentalDurationHours?: number;
  acceptedPaymentMethods?: string[];
  onIsFreeChange: (value: boolean) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onAccessTypeChange?: (value: string) => void;
  onRentalPriceChange?: (value: string) => void;
  onRentalDurationChange?: (value: number) => void;
  onPaymentMethodsChange?: (methods: string[]) => void;
}

const suggestedPrices: Record<string, { price: string; label: string }> = {
  video_musical_vivo: { price: "9.99", label: "Video Musical en Vivo" },
  video_clip: { price: "4.99", label: "Video Clip" },
  podcast: { price: "2.99", label: "Podcast" },
  documental: { price: "7.99", label: "Documental" },
  corto: { price: "3.99", label: "Cortos" },
  pelicula: { price: "12.99", label: "Películas" },
};

const currencies = [
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "ARS", label: "ARS - Peso Argentino" },
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "COP", label: "COP - Peso Colombiano" },
  { value: "CLP", label: "CLP - Peso Chileno" },
  { value: "BRL", label: "BRL - Real Brasileño" },
  { value: "PEN", label: "PEN - Sol Peruano" },
  { value: "UYU", label: "UYU - Peso Uruguayo" },
];

const accessTypes = [
  { value: "purchase", label: "Compra permanente", icon: ShoppingCart, description: "El usuario compra y tiene acceso de por vida" },
  { value: "rental", label: "Alquiler temporal", icon: Clock, description: "Acceso por tiempo limitado a menor precio" },
  { value: "subscription", label: "Solo suscriptores", icon: Crown, description: "Requiere suscripción activa" },
];

const paymentMethods = [
  { id: "stripe", label: "Tarjetas (Stripe)", icon: CreditCard },
  { id: "mercadopago", label: "MercadoPago", icon: Wallet },
  { id: "paypal", label: "PayPal", icon: Wallet },
  { id: "crypto", label: "Criptomonedas", icon: Bitcoin },
  { id: "bank_transfer", label: "Transferencia Bancaria", icon: Building2 },
];

const rentalDurations = [
  { value: 24, label: "24 horas" },
  { value: 48, label: "48 horas" },
  { value: 72, label: "72 horas" },
  { value: 168, label: "7 días" },
];

export const MonetizationSection = ({
  isFree,
  price,
  currency,
  contentType = "",
  accessType = "purchase",
  rentalPrice = "",
  rentalDurationHours = 48,
  acceptedPaymentMethods = ["stripe", "mercadopago", "paypal"],
  onIsFreeChange,
  onPriceChange,
  onCurrencyChange,
  onAccessTypeChange,
  onRentalPriceChange,
  onRentalDurationChange,
  onPaymentMethodsChange,
}: MonetizationSectionProps) => {
  const { t } = useTranslation();
  const [authorPct, setAuthorPct] = useState(70);
  const [platformPct, setPlatformPct] = useState(30);

  useEffect(() => {
    const fetchRevenueSplit = async () => {
      const { data } = await supabase
        .from('platform_payment_settings')
        .select('setting_value')
        .eq('setting_key', 'single_content_purchase')
        .single();
      if (data?.setting_value) {
        const val = data.setting_value as Record<string, unknown>;
        if (val.author_percentage) setAuthorPct(Number(val.author_percentage));
        if (val.platform_percentage) setPlatformPct(Number(val.platform_percentage));
      }
    };
    fetchRevenueSplit();
  }, []);
  
  const suggestedPrice = contentType ? suggestedPrices[contentType] : null;
  
  const handleApplySuggestedPrice = () => {
    if (suggestedPrice) {
      onPriceChange(suggestedPrice.price);
    }
  };

  const handlePaymentMethodToggle = (methodId: string, checked: boolean) => {
    if (!onPaymentMethodsChange) return;
    
    if (checked) {
      onPaymentMethodsChange([...acceptedPaymentMethods, methodId]);
    } else {
      onPaymentMethodsChange(acceptedPaymentMethods.filter(m => m !== methodId));
    }
  };

  return (
    <div className="border-t pt-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.monetization')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('upload.monetizationDesc')}
        </p>
      </div>

      {/* Revenue Share Info */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Reparto de ingresos:</strong> Por cada venta recibirás el <span className="text-primary font-semibold">{authorPct}%</span> del precio. 
          El <span className="text-muted-foreground">{platformPct}%</span> restante corresponde a Red Akasha por gastos de plataforma y transacción.
        </AlertDescription>
      </Alert>

      {/* Free/Paid Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_free" className="text-base">
            {t('upload.freeContent')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {isFree ? t('upload.freeContentDesc') : t('upload.paidContentDesc')}
          </p>
        </div>
        <Switch
          id="is_free"
          checked={isFree}
          onCheckedChange={onIsFreeChange}
        />
      </div>

      {!isFree && (
        <div className="space-y-6">
          {/* Suggested Price */}
          {suggestedPrice && (
            <div className="p-4 rounded-lg border border-cyan-400/30 bg-cyan-400/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-400">Precio sugerido para {suggestedPrice.label}</p>
                  <p className="text-2xl font-bold text-foreground">USD ${suggestedPrice.price}</p>
                </div>
                <button
                  type="button"
                  onClick={handleApplySuggestedPrice}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                >
                  Aplicar precio
                </button>
              </div>
            </div>
          )}

          {/* Access Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de acceso</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {accessTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = accessType === type.value;
                return (
                  <Card 
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-cyan-400 bg-cyan-400/10' 
                        : 'border-border hover:border-cyan-400/50'
                    }`}
                    onClick={() => onAccessTypeChange?.(type.value)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-card/50">
            {/* Purchase Price */}
            {(accessType === "purchase" || accessType === "rental") && (
              <div className="space-y-2">
                <Label htmlFor="price">
                  {accessType === "purchase" ? "Precio de compra" : "Precio de compra (opcional)"} 
                  {accessType === "purchase" && " *"}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required={accessType === "purchase"}
                  value={price}
                  onChange={(e) => onPriceChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Rental Price */}
            {accessType === "rental" && (
              <div className="space-y-2">
                <Label htmlFor="rental_price">Precio de alquiler *</Label>
                <Input
                  id="rental_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={rentalPrice}
                  onChange={(e) => onRentalPriceChange?.(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">{t('upload.currency')}</Label>
              <Select value={currency} onValueChange={onCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('upload.selectCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rental Duration */}
            {accessType === "rental" && (
              <div className="space-y-2">
                <Label htmlFor="rental_duration">Duración del alquiler</Label>
                <Select 
                  value={rentalDurationHours.toString()} 
                  onValueChange={(v) => onRentalDurationChange?.(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rentalDurations.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Métodos de pago aceptados</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isChecked = acceptedPaymentMethods.includes(method.id);
                return (
                  <div 
                    key={method.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                      isChecked 
                        ? 'border-cyan-400 bg-cyan-400/10' 
                        : 'border-border hover:border-cyan-400/50'
                    }`}
                    onClick={() => handlePaymentMethodToggle(method.id, !isChecked)}
                  >
                    <Checkbox
                      id={method.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, !!checked)}
                    />
                    <Icon className={`w-4 h-4 ${isChecked ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                    <Label 
                      htmlFor={method.id} 
                      className="text-xs cursor-pointer"
                    >
                      {method.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Badge */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="text-xs">
              {accessType === "purchase" && `Compra: ${currency} ${price || '0'}`}
              {accessType === "rental" && `Alquiler: ${currency} ${rentalPrice || '0'} / ${rentalDurationHours}h`}
              {accessType === "subscription" && "Solo suscriptores"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {acceptedPaymentMethods.length} método(s) de pago
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

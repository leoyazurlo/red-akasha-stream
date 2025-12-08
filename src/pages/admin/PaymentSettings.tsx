import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, DollarSign, Percent, Globe, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string;
}

const PaymentSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_payment_settings')
        .select('*');
      
      if (error) throw error;
      return data as PaymentSetting[];
    }
  });

  useEffect(() => {
    if (paymentSettings) {
      const settingsMap: Record<string, any> = {};
      paymentSettings.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsMap);
    }
  }, [paymentSettings]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('platform_payment_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
      toast.success('Configuración actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    }
  });

  const handleSaveAll = () => {
    Object.entries(settings).forEach(([key, value]) => {
      updateMutation.mutate({ key, value });
    });
  };

  const updateSetting = (key: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const latinCountries = settings.latin_america_countries?.countries || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_hsl(180,100%,50%)]">
            Configuración de Pagos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los precios, suscripciones y porcentajes de la plataforma
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>

      {/* Acceso Gratuito Latinoamérica */}
      <Card className="bg-card/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Globe className="h-5 w-5" />
            Acceso Gratuito por Región
          </CardTitle>
          <CardDescription>
            Configura qué regiones tienen acceso gratuito al contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Latinoamérica Gratis</Label>
              <p className="text-sm text-muted-foreground">
                Los usuarios de Latinoamérica acceden al contenido sin pagar
              </p>
            </div>
            <Switch
              checked={settings.free_access_enabled?.enabled || false}
              onCheckedChange={(checked) => updateSetting('free_access_enabled', 'enabled', checked)}
            />
          </div>
          
          <div className="mt-4">
            <Label className="text-sm text-muted-foreground">Países incluidos:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {latinCountries.map((code: string) => (
                <Badge key={code} variant="secondary" className="bg-cyan-500/10 text-cyan-400">
                  {code}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suscripción Mensual */}
      <Card className="bg-card/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <DollarSign className="h-5 w-5" />
            Suscripción Mensual
          </CardTitle>
          <CardDescription>
            Precio y distribución para suscriptores mensuales
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Precio (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings.subscription_monthly?.price || 0}
              onChange={(e) => updateSetting('subscription_monthly', 'price', parseFloat(e.target.value))}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Autor
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.subscription_monthly?.author_percentage || 0}
              onChange={(e) => updateSetting('subscription_monthly', 'author_percentage', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Plataforma
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.subscription_monthly?.platform_percentage || 0}
              onChange={(e) => updateSetting('subscription_monthly', 'platform_percentage', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suscripción Anual */}
      <Card className="bg-card/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <DollarSign className="h-5 w-5" />
            Suscripción Anual
          </CardTitle>
          <CardDescription>
            Precio y distribución para suscriptores anuales
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Precio (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings.subscription_annual?.price || 0}
              onChange={(e) => updateSetting('subscription_annual', 'price', parseFloat(e.target.value))}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Autor
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.subscription_annual?.author_percentage || 0}
              onChange={(e) => updateSetting('subscription_annual', 'author_percentage', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Plataforma
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.subscription_annual?.platform_percentage || 0}
              onChange={(e) => updateSetting('subscription_annual', 'platform_percentage', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Compra Única */}
      <Card className="bg-card/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <DollarSign className="h-5 w-5" />
            Compra Única de Contenido
          </CardTitle>
          <CardDescription>
            Precio por defecto y distribución para compras individuales
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Precio Default (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings.single_content_purchase?.default_price || 0}
              onChange={(e) => updateSetting('single_content_purchase', 'default_price', parseFloat(e.target.value))}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Autor
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.single_content_purchase?.author_percentage || 0}
              onChange={(e) => updateSetting('single_content_purchase', 'author_percentage', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Plataforma
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.single_content_purchase?.platform_percentage || 0}
              onChange={(e) => updateSetting('single_content_purchase', 'platform_percentage', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettings;
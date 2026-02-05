import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, DollarSign, Percent, Globe, Save, ArrowLeft } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface PaymentSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string;
}

const PaymentSettings = () => {
  const navigate = useNavigate();
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </AdminLayout>
    );
  }

  const latinCountries = settings.latin_america_countries?.countries || [];
   const platformAccounts = settings.platform_payment_accounts || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin')}
            className="text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
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

         <Tabs defaultValue="revenue" className="space-y-6">
           <TabsList className="bg-card/50 border border-cyan-500/20">
             <TabsTrigger value="revenue">Revenue Share</TabsTrigger>
             <TabsTrigger value="platform-accounts">Cuentas Red Akasha</TabsTrigger>
             <TabsTrigger value="regions">Acceso por Región</TabsTrigger>
           </TabsList>

           {/* Revenue Share Tab */}
           <TabsContent value="revenue" className="space-y-6">
             {/* Info Banner */}
             <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
               <CardContent className="p-4">
                 <div className="flex items-start gap-3">
                   <DollarSign className="h-6 w-6 text-cyan-400 mt-0.5" />
                   <div>
                     <h3 className="font-semibold text-cyan-400">Modelo Revenue Share</h3>
                     <p className="text-sm text-muted-foreground mt-1">
                       El porcentaje del <strong>Creador</strong> va directamente al usuario que subió el contenido. 
                       El porcentaje de la <strong>Plataforma</strong> (Red Akasha) se deposita en las cuentas configuradas abajo.
                     </p>
                   </div>
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
                   Precio por defecto y distribución para compras individuales (70% Creador / 30% Plataforma)
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid gap-4 md:grid-cols-3">
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
                       <Percent className="h-3 w-3" /> Creador
                     </Label>
                     <Input
                       type="number"
                       min="0"
                       max="100"
                       value={settings.single_content_purchase?.author_percentage || 70}
                       onChange={(e) => updateSetting('single_content_purchase', 'author_percentage', parseInt(e.target.value))}
                       className="bg-background/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="flex items-center gap-1">
                       <Percent className="h-3 w-3" /> Red Akasha
                     </Label>
                     <Input
                       type="number"
                       min="0"
                       max="100"
                       value={settings.single_content_purchase?.platform_percentage || 30}
                       onChange={(e) => updateSetting('single_content_purchase', 'platform_percentage', parseInt(e.target.value))}
                       className="bg-background/50"
                     />
                   </div>
                 </div>
                 <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                   <p className="text-sm text-muted-foreground">
                     <strong className="text-cyan-400">Ejemplo:</strong> Si el contenido cuesta $5 USD → Creador recibe ${((5 * (settings.single_content_purchase?.author_percentage || 70)) / 100).toFixed(2)} USD | Red Akasha recibe ${((5 * (settings.single_content_purchase?.platform_percentage || 30)) / 100).toFixed(2)} USD
                   </p>
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
                   Precio y distribución para suscriptores mensuales (fuera de Latinoamérica)
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid gap-4 md:grid-cols-3">
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
                       <Percent className="h-3 w-3" /> Creadores (Pozo Común)
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
                       <Percent className="h-3 w-3" /> Red Akasha
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
                 </div>
                 <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                   <p className="text-sm text-muted-foreground">
                     <strong className="text-cyan-400">Pozo Común:</strong> El {settings.subscription_monthly?.author_percentage || 70}% se distribuye mensualmente entre creadores activos según contenido más visto.
                   </p>
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
               <CardContent className="space-y-4">
                 <div className="grid gap-4 md:grid-cols-3">
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
                       <Percent className="h-3 w-3" /> Creadores (Pozo Común)
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
                       <Percent className="h-3 w-3" /> Red Akasha
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
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

           {/* Platform Accounts Tab */}
           <TabsContent value="platform-accounts" className="space-y-6">
             <Card className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-500/30">
               <CardContent className="p-4">
                 <div className="flex items-start gap-3">
                   <DollarSign className="h-6 w-6 text-green-400 mt-0.5" />
                   <div>
                     <h3 className="font-semibold text-green-400">Cuentas de Red Akasha</h3>
                     <p className="text-sm text-muted-foreground mt-1">
                       Configura las cuentas donde se depositará el porcentaje de la plataforma ({settings.single_content_purchase?.platform_percentage || 30}%) de cada venta.
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* MercadoPago */}
             <Card className="bg-card/50 border-cyan-500/20">
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2 text-cyan-400">
                     💳 MercadoPago
                   </CardTitle>
                   <Switch
                     checked={platformAccounts.mercadopago?.enabled || false}
                     onCheckedChange={(checked) => {
                       setSettings(prev => ({
                         ...prev,
                         platform_payment_accounts: {
                           ...prev.platform_payment_accounts,
                           mercadopago: {
                             ...prev.platform_payment_accounts?.mercadopago,
                             enabled: checked
                           }
                         }
                       }));
                     }}
                   />
                 </div>
                 <CardDescription>
                   Cuenta MercadoPago para recibir pagos de usuarios de Latinoamérica
                 </CardDescription>
               </CardHeader>
               {platformAccounts.mercadopago?.enabled && (
                 <CardContent className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <Label>Email de MercadoPago</Label>
                     <Input
                       type="email"
                       value={platformAccounts.mercadopago?.email || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             mercadopago: {
                               ...prev.platform_payment_accounts?.mercadopago,
                               email: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="pagos@redakasha.com"
                       className="bg-background/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Alias</Label>
                     <Input
                       value={platformAccounts.mercadopago?.alias || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             mercadopago: {
                               ...prev.platform_payment_accounts?.mercadopago,
                               alias: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="REDAKASHA.MP"
                       className="bg-background/50"
                     />
                   </div>
                 </CardContent>
               )}
             </Card>

             {/* PayPal */}
             <Card className="bg-card/50 border-cyan-500/20">
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2 text-cyan-400">
                     🅿️ PayPal
                   </CardTitle>
                   <Switch
                     checked={platformAccounts.paypal?.enabled || false}
                     onCheckedChange={(checked) => {
                       setSettings(prev => ({
                         ...prev,
                         platform_payment_accounts: {
                           ...prev.platform_payment_accounts,
                           paypal: {
                             ...prev.platform_payment_accounts?.paypal,
                             enabled: checked
                           }
                         }
                       }));
                     }}
                   />
                 </div>
                 <CardDescription>
                   Cuenta PayPal para recibir pagos internacionales
                 </CardDescription>
               </CardHeader>
               {platformAccounts.paypal?.enabled && (
                 <CardContent>
                   <div className="space-y-2">
                     <Label>Email de PayPal</Label>
                     <Input
                       type="email"
                       value={platformAccounts.paypal?.email || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             paypal: {
                               ...prev.platform_payment_accounts?.paypal,
                               email: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="paypal@redakasha.com"
                       className="bg-background/50"
                     />
                   </div>
                 </CardContent>
               )}
             </Card>

             {/* Transferencia Bancaria */}
             <Card className="bg-card/50 border-cyan-500/20">
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2 text-cyan-400">
                     🏦 Transferencia Bancaria
                   </CardTitle>
                   <Switch
                     checked={platformAccounts.bank_transfer?.enabled || false}
                     onCheckedChange={(checked) => {
                       setSettings(prev => ({
                         ...prev,
                         platform_payment_accounts: {
                           ...prev.platform_payment_accounts,
                           bank_transfer: {
                             ...prev.platform_payment_accounts?.bank_transfer,
                             enabled: checked
                           }
                         }
                       }));
                     }}
                   />
                 </div>
                 <CardDescription>
                   Datos bancarios para recibir transferencias
                 </CardDescription>
               </CardHeader>
               {platformAccounts.bank_transfer?.enabled && (
                 <CardContent className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <Label>Nombre del Banco</Label>
                     <Input
                       value={platformAccounts.bank_transfer?.bank_name || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             bank_transfer: {
                               ...prev.platform_payment_accounts?.bank_transfer,
                               bank_name: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="Banco Santander"
                       className="bg-background/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Titular de la Cuenta</Label>
                     <Input
                       value={platformAccounts.bank_transfer?.account_holder || 'Red Akasha'}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             bank_transfer: {
                               ...prev.platform_payment_accounts?.bank_transfer,
                               account_holder: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="Red Akasha SRL"
                       className="bg-background/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>CBU / CVU</Label>
                     <Input
                       value={platformAccounts.bank_transfer?.cbu_cvu || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             bank_transfer: {
                               ...prev.platform_payment_accounts?.bank_transfer,
                               cbu_cvu: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="0000000000000000000000"
                       className="bg-background/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Código SWIFT (internacional)</Label>
                     <Input
                       value={platformAccounts.bank_transfer?.swift_code || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             bank_transfer: {
                               ...prev.platform_payment_accounts?.bank_transfer,
                               swift_code: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="BSCHESMMXXX"
                       className="bg-background/50"
                     />
                   </div>
                 </CardContent>
               )}
             </Card>

             {/* Crypto */}
             <Card className="bg-card/50 border-cyan-500/20">
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2 text-cyan-400">
                     ₿ Criptomonedas
                   </CardTitle>
                   <Switch
                     checked={platformAccounts.crypto?.enabled || false}
                     onCheckedChange={(checked) => {
                       setSettings(prev => ({
                         ...prev,
                         platform_payment_accounts: {
                           ...prev.platform_payment_accounts,
                           crypto: {
                             ...prev.platform_payment_accounts?.crypto,
                             enabled: checked
                           }
                         }
                       }));
                     }}
                   />
                 </div>
                 <CardDescription>
                   Direcciones de billeteras para recibir pagos en crypto
                 </CardDescription>
               </CardHeader>
               {platformAccounts.crypto?.enabled && (
                 <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label>Bitcoin (BTC)</Label>
                     <Input
                       value={platformAccounts.crypto?.btc_address || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             crypto: {
                               ...prev.platform_payment_accounts?.crypto,
                               btc_address: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="bc1q..."
                       className="bg-background/50 font-mono text-sm"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Ethereum (ETH)</Label>
                     <Input
                       value={platformAccounts.crypto?.eth_address || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             crypto: {
                               ...prev.platform_payment_accounts?.crypto,
                               eth_address: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="0x..."
                       className="bg-background/50 font-mono text-sm"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>USDT (TRC20)</Label>
                     <Input
                       value={platformAccounts.crypto?.usdt_address || ''}
                       onChange={(e) => {
                         setSettings(prev => ({
                           ...prev,
                           platform_payment_accounts: {
                             ...prev.platform_payment_accounts,
                             crypto: {
                               ...prev.platform_payment_accounts?.crypto,
                               usdt_address: e.target.value
                             }
                           }
                         }));
                       }}
                       placeholder="T..."
                       className="bg-background/50 font-mono text-sm"
                     />
                   </div>
                 </CardContent>
               )}
             </Card>
           </TabsContent>

           {/* Regions Tab */}
           <TabsContent value="regions" className="space-y-6">
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
           </TabsContent>

           {/* Fixed Save Button at bottom */}
           <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-cyan-500/20 p-4 -mx-6 mt-6">
             <div className="flex justify-end gap-3">
               <Button 
                 variant="outline" 
                 onClick={() => window.location.reload()}
                 className="border-muted-foreground/30"
               >
                 Cancelar
               </Button>
               <Button 
                 onClick={handleSaveAll} 
                 disabled={updateMutation.isPending}
                 className="bg-cyan-500 hover:bg-cyan-600 text-black min-w-[150px]"
               >
                 {updateMutation.isPending ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Guardando...
                   </>
                 ) : (
                   <>
                     <Save className="h-4 w-4 mr-2" />
                     Guardar Cambios
                   </>
                 )}
               </Button>
             </div>
           </div>
         </Tabs>
      </div>
    </AdminLayout>
  );
};

export default PaymentSettings;
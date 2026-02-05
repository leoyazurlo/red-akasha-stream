 import { useState, useEffect } from "react";
 import { useTranslation } from "react-i18next";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { toast } from "sonner";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Loader2, Building2, Wallet, CreditCard, Bitcoin, CheckCircle2, AlertCircle } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 
 interface BankingInfo {
   id?: string;
   bank_name: string;
   account_holder_name: string;
   account_number_encrypted: string;
   account_type: string;
   cbu_cvu: string;
   mercadopago_email: string;
   paypal_email: string;
   crypto_wallet_address: string;
   crypto_wallet_type: string;
   preferred_payment_method: string;
   country: string;
   is_verified: boolean;
 }
 
 const defaultBankingInfo: BankingInfo = {
   bank_name: "",
   account_holder_name: "",
   account_number_encrypted: "",
   account_type: "checking",
   cbu_cvu: "",
   mercadopago_email: "",
   paypal_email: "",
   crypto_wallet_address: "",
   crypto_wallet_type: "bitcoin",
   preferred_payment_method: "bank_transfer",
   country: "",
   is_verified: false,
 };
 
 export const UserBankingForm = () => {
   const { t } = useTranslation();
   const { user } = useAuth();
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [bankingInfo, setBankingInfo] = useState<BankingInfo>(defaultBankingInfo);
   const [hasExistingInfo, setHasExistingInfo] = useState(false);
 
   useEffect(() => {
     if (user?.id) {
       fetchBankingInfo();
     }
   }, [user?.id]);
 
   const fetchBankingInfo = async () => {
     try {
       const { data, error } = await supabase
         .from('user_banking_info')
         .select('*')
         .eq('user_id', user?.id)
         .maybeSingle();
 
       if (error) throw error;
       
       if (data) {
         setBankingInfo(data as BankingInfo);
         setHasExistingInfo(true);
       }
     } catch (error) {
       console.error('Error fetching banking info:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const handleSave = async () => {
     if (!user?.id) return;
     setSaving(true);
 
     try {
       const dataToSave = {
         ...bankingInfo,
         user_id: user.id,
       };
 
       if (hasExistingInfo) {
         const { error } = await supabase
           .from('user_banking_info')
           .update(dataToSave)
           .eq('user_id', user.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('user_banking_info')
           .insert(dataToSave);
         if (error) throw error;
         setHasExistingInfo(true);
       }
 
       toast.success('Datos bancarios guardados correctamente');
     } catch (error: any) {
       toast.error('Error al guardar: ' + error.message);
     } finally {
       setSaving(false);
     }
   };
 
   const updateField = (field: keyof BankingInfo, value: string | boolean) => {
     setBankingInfo(prev => ({ ...prev, [field]: value }));
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center h-48">
         <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <Card className="bg-card/50 border-cyan-500/20">
         <CardHeader>
           <div className="flex items-center justify-between">
             <div>
               <CardTitle className="flex items-center gap-2 text-cyan-400">
                 <Building2 className="h-5 w-5" />
                 Datos para Cobro
               </CardTitle>
               <CardDescription>
                 Configura tu información de pago para recibir las ganancias de tu contenido
               </CardDescription>
             </div>
             {bankingInfo.is_verified ? (
               <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                 <CheckCircle2 className="h-3 w-3 mr-1" />
                 Verificado
               </Badge>
             ) : (
               <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                 <AlertCircle className="h-3 w-3 mr-1" />
                 Pendiente verificación
               </Badge>
             )}
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* Preferred Payment Method */}
           <div className="space-y-2">
             <Label>Método de pago preferido</Label>
             <Select
               value={bankingInfo.preferred_payment_method}
               onValueChange={(v) => updateField('preferred_payment_method', v)}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="bank_transfer">
                   <div className="flex items-center gap-2">
                     <Building2 className="h-4 w-4" />
                     Transferencia Bancaria
                   </div>
                 </SelectItem>
                 <SelectItem value="mercadopago">
                   <div className="flex items-center gap-2">
                     <Wallet className="h-4 w-4" />
                     MercadoPago
                   </div>
                 </SelectItem>
                 <SelectItem value="paypal">
                   <div className="flex items-center gap-2">
                     <CreditCard className="h-4 w-4" />
                     PayPal
                   </div>
                 </SelectItem>
                 <SelectItem value="crypto">
                   <div className="flex items-center gap-2">
                     <Bitcoin className="h-4 w-4" />
                     Criptomonedas
                   </div>
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {/* Bank Transfer Fields */}
           {bankingInfo.preferred_payment_method === 'bank_transfer' && (
             <div className="space-y-4 p-4 rounded-lg border border-border bg-background/50">
               <h4 className="font-medium text-cyan-400">Datos Bancarios</h4>
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Nombre del Banco</Label>
                   <Input
                     value={bankingInfo.bank_name}
                     onChange={(e) => updateField('bank_name', e.target.value)}
                     placeholder="Ej: Banco Nación"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Titular de la Cuenta</Label>
                   <Input
                     value={bankingInfo.account_holder_name}
                     onChange={(e) => updateField('account_holder_name', e.target.value)}
                     placeholder="Nombre completo"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Número de Cuenta</Label>
                   <Input
                     value={bankingInfo.account_number_encrypted}
                     onChange={(e) => updateField('account_number_encrypted', e.target.value)}
                     placeholder="Número de cuenta"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Tipo de Cuenta</Label>
                   <Select
                     value={bankingInfo.account_type}
                     onValueChange={(v) => updateField('account_type', v)}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="checking">Cuenta Corriente</SelectItem>
                       <SelectItem value="savings">Caja de Ahorro</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2 md:col-span-2">
                   <Label>CBU / CVU / CLABE</Label>
                   <Input
                     value={bankingInfo.cbu_cvu}
                     onChange={(e) => updateField('cbu_cvu', e.target.value)}
                     placeholder="Ingresa tu CBU, CVU o CLABE"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>País</Label>
                   <Input
                     value={bankingInfo.country}
                     onChange={(e) => updateField('country', e.target.value)}
                     placeholder="Ej: Argentina"
                   />
                 </div>
               </div>
             </div>
           )}
 
           {/* MercadoPago Fields */}
           {bankingInfo.preferred_payment_method === 'mercadopago' && (
             <div className="space-y-4 p-4 rounded-lg border border-border bg-background/50">
               <h4 className="font-medium text-cyan-400">MercadoPago</h4>
               <div className="space-y-2">
                 <Label>Email de MercadoPago</Label>
                 <Input
                   type="email"
                   value={bankingInfo.mercadopago_email}
                   onChange={(e) => updateField('mercadopago_email', e.target.value)}
                   placeholder="tu@email.com"
                 />
               </div>
             </div>
           )}
 
           {/* PayPal Fields */}
           {bankingInfo.preferred_payment_method === 'paypal' && (
             <div className="space-y-4 p-4 rounded-lg border border-border bg-background/50">
               <h4 className="font-medium text-cyan-400">PayPal</h4>
               <div className="space-y-2">
                 <Label>Email de PayPal</Label>
                 <Input
                   type="email"
                   value={bankingInfo.paypal_email}
                   onChange={(e) => updateField('paypal_email', e.target.value)}
                   placeholder="tu@email.com"
                 />
               </div>
             </div>
           )}
 
           {/* Crypto Fields */}
           {bankingInfo.preferred_payment_method === 'crypto' && (
             <div className="space-y-4 p-4 rounded-lg border border-border bg-background/50">
               <h4 className="font-medium text-cyan-400">Criptomonedas</h4>
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Tipo de Wallet</Label>
                   <Select
                     value={bankingInfo.crypto_wallet_type}
                     onValueChange={(v) => updateField('crypto_wallet_type', v)}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                       <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                       <SelectItem value="usdt">USDT (Tether)</SelectItem>
                       <SelectItem value="usdc">USDC</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Dirección de Wallet</Label>
                   <Input
                     value={bankingInfo.crypto_wallet_address}
                     onChange={(e) => updateField('crypto_wallet_address', e.target.value)}
                     placeholder="0x..."
                   />
                 </div>
               </div>
             </div>
           )}
 
           <Button onClick={handleSave} disabled={saving} className="w-full">
             {saving ? (
               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
             ) : null}
             Guardar Datos de Cobro
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 };
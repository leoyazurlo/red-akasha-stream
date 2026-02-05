 import { useState, useEffect } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Loader2, DollarSign, TrendingUp, Percent, Clock, CheckCircle2, Wallet } from "lucide-react";
 import { format } from "date-fns";
 import { es } from "date-fns/locale";
 
 interface EarningsSummary {
   totalGross: number;
   totalNet: number;
   totalPlatformFee: number;
   pendingAmount: number;
   paidAmount: number;
   transactionCount: number;
 }
 
 interface PlatformSettings {
   author_percentage: number;
   platform_percentage: number;
 }
 
 export const UserEarningsDashboard = () => {
   const { user } = useAuth();
   const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
     author_percentage: 70,
     platform_percentage: 30,
   });
 
   // Fetch platform settings
   useEffect(() => {
     const fetchSettings = async () => {
       const { data } = await supabase
         .from('platform_payment_settings')
         .select('setting_key, setting_value')
         .eq('setting_key', 'single_content_purchase')
         .maybeSingle();
       
       if (data?.setting_value) {
         const value = data.setting_value as Record<string, any>;
         setPlatformSettings({
           author_percentage: value.author_percentage || 70,
           platform_percentage: value.platform_percentage || 30,
         });
       }
     };
     fetchSettings();
   }, []);
 
   // Fetch user earnings
   const { data: earnings, isLoading: earningsLoading } = useQuery({
     queryKey: ['user-earnings', user?.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('user_earnings')
         .select('*')
         .eq('user_id', user?.id)
         .order('created_at', { ascending: false });
       
       if (error) throw error;
       return data;
     },
     enabled: !!user?.id,
   });
 
   // Fetch user content stats
   const { data: contentStats } = useQuery({
     queryKey: ['user-content-stats', user?.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('content_uploads')
         .select('id, is_free, price, views_count')
         .eq('uploader_id', user?.id);
       
       if (error) throw error;
       
       const totalContent = data?.length || 0;
       const paidContent = data?.filter(c => !c.is_free).length || 0;
       const totalViews = data?.reduce((sum, c) => sum + (c.views_count || 0), 0) || 0;
       
       return { totalContent, paidContent, totalViews };
     },
     enabled: !!user?.id,
   });
 
   // Calculate earnings summary
   const summary: EarningsSummary = earnings?.reduce((acc, e) => ({
     totalGross: acc.totalGross + Number(e.gross_amount),
     totalNet: acc.totalNet + Number(e.net_amount),
     totalPlatformFee: acc.totalPlatformFee + Number(e.platform_fee_amount),
     pendingAmount: acc.pendingAmount + (e.status === 'pending' ? Number(e.net_amount) : 0),
     paidAmount: acc.paidAmount + (e.status === 'paid' ? Number(e.net_amount) : 0),
     transactionCount: acc.transactionCount + 1,
   }), {
     totalGross: 0,
     totalNet: 0,
     totalPlatformFee: 0,
     pendingAmount: 0,
     paidAmount: 0,
     transactionCount: 0,
   }) || {
     totalGross: 0,
     totalNet: 0,
     totalPlatformFee: 0,
     pendingAmount: 0,
     paidAmount: 0,
     transactionCount: 0,
   };
 
   if (earningsLoading) {
     return (
       <div className="flex items-center justify-center h-48">
         <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Platform Fee Info */}
       <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
         <CardHeader className="pb-2">
           <CardTitle className="flex items-center gap-2 text-cyan-400">
             <Percent className="h-5 w-5" />
             Distribución de Ganancias
           </CardTitle>
           <CardDescription>
             Así se distribuye cada venta de tu contenido
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="flex items-center gap-4">
             <div className="flex-1">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm text-muted-foreground">Para ti</span>
                 <span className="text-lg font-bold text-green-400">{platformSettings.author_percentage}%</span>
               </div>
               <div className="h-3 bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                   style={{ width: `${platformSettings.author_percentage}%` }}
                 />
               </div>
             </div>
             <div className="text-2xl text-muted-foreground">/</div>
             <div className="flex-1">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm text-muted-foreground">Plataforma</span>
                 <span className="text-lg font-bold text-cyan-400">{platformSettings.platform_percentage}%</span>
               </div>
               <div className="h-3 bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-cyan-500 to-blue-400"
                   style={{ width: `${platformSettings.platform_percentage}%` }}
                 />
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Stats Grid */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card className="bg-card/50 border-cyan-500/20">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="p-3 rounded-full bg-green-500/10">
                 <DollarSign className="h-6 w-6 text-green-400" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Ganancias Netas</p>
                 <p className="text-2xl font-bold text-green-400">
                   ${summary.totalNet.toFixed(2)}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card className="bg-card/50 border-cyan-500/20">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="p-3 rounded-full bg-yellow-500/10">
                 <Clock className="h-6 w-6 text-yellow-400" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
                 <p className="text-2xl font-bold text-yellow-400">
                   ${summary.pendingAmount.toFixed(2)}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card className="bg-card/50 border-cyan-500/20">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="p-3 rounded-full bg-cyan-500/10">
                 <CheckCircle2 className="h-6 w-6 text-cyan-400" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Ya Cobrado</p>
                 <p className="text-2xl font-bold text-cyan-400">
                   ${summary.paidAmount.toFixed(2)}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card className="bg-card/50 border-cyan-500/20">
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="p-3 rounded-full bg-purple-500/10">
                 <TrendingUp className="h-6 w-6 text-purple-400" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Ventas Totales</p>
                 <p className="text-2xl font-bold text-purple-400">
                   {summary.transactionCount}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Content Stats */}
       {contentStats && (
         <Card className="bg-card/50 border-cyan-500/20">
           <CardHeader>
             <CardTitle className="text-cyan-400">Tu Contenido</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="text-center p-4 rounded-lg bg-background/50">
                 <p className="text-3xl font-bold text-cyan-400">{contentStats.totalContent}</p>
                 <p className="text-sm text-muted-foreground">Contenidos Subidos</p>
               </div>
               <div className="text-center p-4 rounded-lg bg-background/50">
                 <p className="text-3xl font-bold text-green-400">{contentStats.paidContent}</p>
                 <p className="text-sm text-muted-foreground">Contenidos de Pago</p>
               </div>
               <div className="text-center p-4 rounded-lg bg-background/50">
                 <p className="text-3xl font-bold text-purple-400">{contentStats.totalViews.toLocaleString()}</p>
                 <p className="text-sm text-muted-foreground">Visualizaciones Totales</p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Recent Transactions */}
       <Card className="bg-card/50 border-cyan-500/20">
         <CardHeader>
           <CardTitle className="flex items-center gap-2 text-cyan-400">
             <Wallet className="h-5 w-5" />
             Historial de Ganancias
           </CardTitle>
         </CardHeader>
         <CardContent>
           {!earnings || earnings.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Aún no tienes ganancias registradas</p>
               <p className="text-sm">Sube contenido de pago para empezar a generar ingresos</p>
             </div>
           ) : (
             <div className="space-y-3">
               {earnings.slice(0, 10).map((earning) => (
                 <div 
                   key={earning.id}
                   className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                 >
                   <div>
                     <p className="font-medium">Venta de contenido</p>
                     <p className="text-sm text-muted-foreground">
                       {format(new Date(earning.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-green-400">+${Number(earning.net_amount).toFixed(2)}</p>
                     <Badge 
                       variant="outline"
                       className={
                         earning.status === 'paid' 
                           ? 'border-green-500/30 text-green-400'
                           : earning.status === 'pending'
                           ? 'border-yellow-500/30 text-yellow-400'
                           : 'border-muted-foreground/30'
                       }
                     >
                       {earning.status === 'paid' ? 'Pagado' : 
                        earning.status === 'pending' ? 'Pendiente' : 
                        earning.status === 'approved' ? 'Aprobado' : 'Cancelado'}
                     </Badge>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
 import { useState, useEffect, useMemo } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Loader2, DollarSign, TrendingUp, Percent, Clock, CheckCircle2, Wallet, Video, Music, Image, Mic, FileText, Eye } from "lucide-react";
 import { format } from "date-fns";
 import { es } from "date-fns/locale";
 import { Separator } from "@/components/ui/separator";
 
 interface EarningsSummary {
   totalGross: number;
   totalNet: number;
   totalPlatformFee: number;
   pendingAmount: number;
   paidAmount: number;
   transactionCount: number;
 }
 
 interface ContentTypeStats {
   type: string;
   label: string;
   icon: React.ReactNode;
   count: number;
   paidCount: number;
   views: number;
   earnings: number;
   pending: number;
   color: string;
 }
 
 interface PlatformSettings {
   author_percentage: number;
   platform_percentage: number;
 }
 
 export const UserEarningsDashboard = () => {
   const { user } = useAuth();
   const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    author_percentage: 60,
    platform_percentage: 40,
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
 
   // Fetch user content with type breakdown
   const { data: contentData } = useQuery({
     queryKey: ['user-content-stats', user?.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('content_uploads')
         .select('id, content_type, is_free, price, views_count')
         .eq('uploader_id', user?.id);
       
       if (error) throw error;
       return data || [];
     },
     enabled: !!user?.id,
   });
 
   // Calculate stats by content type
   const contentTypeStats: ContentTypeStats[] = useMemo(() => {
     const types = [
       { type: 'video_clip', label: 'Video Clip', icon: <Video className="h-5 w-5" />, color: 'text-cyan-400' },
       { type: 'musica_en_vivo', label: 'Música en Vivo', icon: <Music className="h-5 w-5" />, color: 'text-green-400' },
       { type: 'dj_set', label: 'DJ Set', icon: <Music className="h-5 w-5" />, color: 'text-purple-400' },
       { type: 'podcast', label: 'Podcast', icon: <Mic className="h-5 w-5" />, color: 'text-orange-400' },
       { type: 'documental', label: 'Documental', icon: <FileText className="h-5 w-5" />, color: 'text-blue-400' },
       { type: 'foto', label: 'Fotografía', icon: <Image className="h-5 w-5" />, color: 'text-pink-400' },
     ];
 
     return types.map(t => {
       const typeContent = contentData?.filter(c => c.content_type === t.type) || [];
       const typeEarnings = earnings?.filter(e => {
         const content = contentData?.find(c => c.id === e.content_id);
         return content?.content_type === t.type;
       }) || [];
 
       return {
         ...t,
         count: typeContent.length,
         paidCount: typeContent.filter(c => !c.is_free).length,
         views: typeContent.reduce((sum, c) => sum + (c.views_count || 0), 0),
         earnings: typeEarnings.reduce((sum, e) => sum + (e.status !== 'cancelled' ? Number(e.net_amount) : 0), 0),
         pending: typeEarnings.reduce((sum, e) => sum + (e.status === 'pending' ? Number(e.net_amount) : 0), 0),
       };
     }).filter(t => t.count > 0 || t.earnings > 0);
   }, [contentData, earnings]);
 
   // Total stats
   const totalStats = useMemo(() => {
     return {
       totalContent: contentData?.length || 0,
       paidContent: contentData?.filter(c => !c.is_free).length || 0,
       totalViews: contentData?.reduce((sum, c) => sum + (c.views_count || 0), 0) || 0,
     };
   }, [contentData]);
 
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
            Distribución de ingresos por cada venta
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="flex items-center gap-4">
             <div className="flex-1">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tu ganancia</span>
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
                  <span className="text-sm text-muted-foreground">Red Akasha</span>
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
 
       {/* Content Stats by Type */}
       <Card className="bg-card/50 border-cyan-500/20">
         <CardHeader>
           <CardTitle className="text-cyan-400">Ganancias por Tipo de Contenido</CardTitle>
           <CardDescription>Desglose de ingresos por cada formato</CardDescription>
         </CardHeader>
         <CardContent>
           {contentTypeStats.length > 0 ? (
             <div className="space-y-4">
               {contentTypeStats.map((stat) => (
                 <div key={stat.type} className="p-4 rounded-lg bg-background/50 border border-border">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg bg-card ${stat.color}`}>
                         {stat.icon}
                       </div>
                       <div>
                         <h4 className="font-semibold">{stat.label}</h4>
                         <p className="text-xs text-muted-foreground">
                           {stat.count} contenido{stat.count !== 1 ? 's' : ''} • {stat.paidCount} de pago
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-xl font-bold text-green-400">${stat.earnings.toFixed(2)}</p>
                       {stat.pending > 0 && (
                         <p className="text-xs text-yellow-400">${stat.pending.toFixed(2)} pendiente</p>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-4 text-sm text-muted-foreground">
                     <div className="flex items-center gap-1">
                       <Eye className="h-4 w-4" />
                       <span>{stat.views.toLocaleString()} vistas</span>
                     </div>
                   </div>
                 </div>
               ))}
 
               {/* Total Summary */}
               <Separator className="my-4" />
               <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-cyan-500/20">
                       <DollarSign className="h-5 w-5 text-cyan-400" />
                     </div>
                     <div>
                       <h4 className="font-semibold text-lg">Total General</h4>
                       <p className="text-xs text-muted-foreground">
                         {totalStats.totalContent} contenidos • {totalStats.paidContent} de pago • {totalStats.totalViews.toLocaleString()} vistas
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-2xl font-bold text-green-400">${summary.totalNet.toFixed(2)}</p>
                     {summary.pendingAmount > 0 && (
                       <p className="text-sm text-yellow-400">${summary.pendingAmount.toFixed(2)} pendiente</p>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Aún no tienes contenido subido</p>
               <p className="text-sm">Sube videos, música o fotos para empezar a generar ingresos</p>
             </div>
           )}
         </CardContent>
       </Card>
 
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
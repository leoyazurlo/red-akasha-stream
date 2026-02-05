 import { useAuth } from "@/hooks/useAuth";
 import { Navigate } from "react-router-dom";
 import { AdminLayout } from "@/components/admin/AdminLayout";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Loader2, Users, Video, MessageSquare, Heart, Share2, DollarSign, TrendingUp, Download, FileSpreadsheet, Calendar } from "lucide-react";
 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
 import { useToast } from "@/hooks/use-toast";
 import { exportToExcel, formatDate, CONTENT_TYPE_LABELS, PROFILE_TYPE_LABELS } from "@/lib/exportUtils";
 import { format, subDays, subWeeks, subMonths, subYears, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
 import { es } from "date-fns/locale";
 
 type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
 
 interface ReportStats {
   users: {
     total: number;
     newInPeriod: number;
     byType: Record<string, number>;
     byCountry: Record<string, number>;
   };
   content: {
     total: number;
     newInPeriod: number;
     approved: number;
     pending: number;
     rejected: number;
     byType: Record<string, number>;
   };
   interactions: {
     totalLikes: number;
     totalComments: number;
     totalShares: number;
     totalViews: number;
   };
   forum: {
     totalThreads: number;
     totalPosts: number;
     newThreadsInPeriod: number;
     newPostsInPeriod: number;
   };
   monetization: {
     totalRevenue: number;
     revenueInPeriod: number;
     totalPurchases: number;
     purchasesInPeriod: number;
   };
   timeline: Array<{
     date: string;
     users: number;
     content: number;
     interactions: number;
   }>;
 }
 
 const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
 
 export default function AdminReports() {
   const { user, loading, isAdmin } = useAuth(true);
   const { toast } = useToast();
   const [period, setPeriod] = useState<PeriodType>('monthly');
   const [stats, setStats] = useState<ReportStats | null>(null);
   const [loadingStats, setLoadingStats] = useState(true);
 
   const getPeriodDates = (periodType: PeriodType) => {
     const now = new Date();
     let startDate: Date;
     let intervals: Date[];
 
     switch (periodType) {
       case 'weekly':
         startDate = subWeeks(now, 1);
         intervals = eachDayOfInterval({ start: startDate, end: now });
         break;
       case 'biweekly':
         startDate = subWeeks(now, 2);
         intervals = eachDayOfInterval({ start: startDate, end: now });
         break;
       case 'monthly':
         startDate = subMonths(now, 1);
         intervals = eachDayOfInterval({ start: startDate, end: now });
         break;
       case 'yearly':
         startDate = subYears(now, 1);
         intervals = eachMonthOfInterval({ start: startDate, end: now });
         break;
     }
 
     return { startDate, endDate: now, intervals };
   };
 
   const getPeriodLabel = (periodType: PeriodType) => {
     switch (periodType) {
       case 'weekly': return 'Última semana';
       case 'biweekly': return 'Últimas 2 semanas';
       case 'monthly': return 'Último mes';
       case 'yearly': return 'Último año';
     }
   };
 
   useEffect(() => {
     if (!loading && user && isAdmin) {
       loadReportData();
     }
   }, [loading, user, isAdmin, period]);
 
   const loadReportData = async () => {
     try {
       setLoadingStats(true);
       const { startDate, endDate, intervals } = getPeriodDates(period);
       const startISO = startDate.toISOString();
 
       // Fetch all data in parallel
       const [
         profilesRes,
         contentRes,
         likesRes,
         commentsRes,
         sharesRes,
         threadsRes,
         postsRes,
         purchasesRes,
       ] = await Promise.all([
         supabase.from('profile_details').select('id, profile_type, pais, created_at'),
         supabase.from('content_uploads').select('id, content_type, status, views_count, created_at'),
         supabase.from('content_likes').select('id, created_at'),
         supabase.from('content_comments').select('id, created_at'),
         supabase.from('content_shares').select('id, created_at'),
         supabase.from('forum_threads').select('id, created_at'),
         supabase.from('forum_posts').select('id, created_at'),
         supabase.from('content_purchases').select('id, amount, created_at, status'),
       ]);
 
       const profiles = profilesRes.data || [];
       const content = contentRes.data || [];
       const likes = likesRes.data || [];
       const comments = commentsRes.data || [];
       const shares = sharesRes.data || [];
       const threads = threadsRes.data || [];
       const posts = postsRes.data || [];
       const purchases = (purchasesRes.data || []).filter(p => p.status === 'completed');
 
       // Calculate users stats
       const newUsersInPeriod = profiles.filter(p => new Date(p.created_at) >= startDate).length;
       const usersByType: Record<string, number> = {};
       const usersByCountry: Record<string, number> = {};
       profiles.forEach(p => {
         usersByType[p.profile_type] = (usersByType[p.profile_type] || 0) + 1;
         if (p.pais) {
           usersByCountry[p.pais] = (usersByCountry[p.pais] || 0) + 1;
         }
       });
 
       // Calculate content stats
       const newContentInPeriod = content.filter(c => new Date(c.created_at) >= startDate).length;
       const contentByType: Record<string, number> = {};
       content.forEach(c => {
         contentByType[c.content_type] = (contentByType[c.content_type] || 0) + 1;
       });
 
       // Calculate monetization
       const purchasesInPeriod = purchases.filter(p => new Date(p.created_at) >= startDate);
       const revenueInPeriod = purchasesInPeriod.reduce((sum, p) => sum + (p.amount || 0), 0);
       const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
 
       // Calculate timeline data
       const timeline = intervals.map(date => {
         const dateStr = period === 'yearly' 
           ? format(date, 'MMM yyyy', { locale: es })
           : format(date, 'dd/MM', { locale: es });
         
         const dayStart = new Date(date);
         dayStart.setHours(0, 0, 0, 0);
         const dayEnd = new Date(date);
         dayEnd.setHours(23, 59, 59, 999);
         
         if (period === 'yearly') {
           const monthStart = startOfMonth(date);
           const monthEnd = new Date(monthStart);
           monthEnd.setMonth(monthEnd.getMonth() + 1);
           
           return {
             date: dateStr,
             users: profiles.filter(p => {
               const d = new Date(p.created_at);
               return d >= monthStart && d < monthEnd;
             }).length,
             content: content.filter(c => {
               const d = new Date(c.created_at);
               return d >= monthStart && d < monthEnd;
             }).length,
             interactions: likes.filter(l => {
               const d = new Date(l.created_at);
               return d >= monthStart && d < monthEnd;
             }).length + comments.filter(c => {
               const d = new Date(c.created_at);
               return d >= monthStart && d < monthEnd;
             }).length,
           };
         }
         
         return {
           date: dateStr,
           users: profiles.filter(p => {
             const d = new Date(p.created_at);
             return d >= dayStart && d <= dayEnd;
           }).length,
           content: content.filter(c => {
             const d = new Date(c.created_at);
             return d >= dayStart && d <= dayEnd;
           }).length,
           interactions: likes.filter(l => {
             const d = new Date(l.created_at);
             return d >= dayStart && d <= dayEnd;
           }).length + comments.filter(c => {
             const d = new Date(c.created_at);
             return d >= dayStart && d <= dayEnd;
           }).length,
         };
       });
 
       setStats({
         users: {
           total: profiles.length,
           newInPeriod: newUsersInPeriod,
           byType: usersByType,
           byCountry: usersByCountry,
         },
         content: {
           total: content.length,
           newInPeriod: newContentInPeriod,
           approved: content.filter(c => c.status === 'approved').length,
           pending: content.filter(c => c.status === 'pending').length,
           rejected: content.filter(c => c.status === 'rejected').length,
           byType: contentByType,
         },
         interactions: {
           totalLikes: likes.length,
           totalComments: comments.length,
           totalShares: shares.length,
           totalViews: content.reduce((sum, c) => sum + (c.views_count || 0), 0),
         },
         forum: {
           totalThreads: threads.length,
           totalPosts: posts.length,
           newThreadsInPeriod: threads.filter(t => new Date(t.created_at) >= startDate).length,
           newPostsInPeriod: posts.filter(p => new Date(p.created_at) >= startDate).length,
         },
         monetization: {
           totalRevenue,
           revenueInPeriod,
           totalPurchases: purchases.length,
           purchasesInPeriod: purchasesInPeriod.length,
         },
         timeline,
       });
     } catch (error) {
       console.error('Error loading report:', error);
       toast({
         title: "Error",
         description: "No se pudieron cargar los datos del informe",
         variant: "destructive",
       });
     } finally {
       setLoadingStats(false);
     }
   };
 
   const handleExportReport = async () => {
     if (!stats) return;
 
     try {
       const periodLabel = getPeriodLabel(period);
       
       // Summary
       const summary = [{
         'Período': periodLabel,
         'Fecha de Generación': formatDate(new Date().toISOString()),
         'Total Usuarios': stats.users.total,
         'Nuevos Usuarios': stats.users.newInPeriod,
         'Total Contenido': stats.content.total,
         'Nuevo Contenido': stats.content.newInPeriod,
         'Total Likes': stats.interactions.totalLikes,
         'Total Comentarios': stats.interactions.totalComments,
         'Total Compartidos': stats.interactions.totalShares,
         'Total Vistas': stats.interactions.totalViews,
         'Ingresos Totales': `$${stats.monetization.totalRevenue.toFixed(2)}`,
         'Ingresos del Período': `$${stats.monetization.revenueInPeriod.toFixed(2)}`,
       }];
 
       // Users by type
       const usersByType = Object.entries(stats.users.byType).map(([type, count]) => ({
         'Tipo de Perfil': PROFILE_TYPE_LABELS[type] || type,
         'Cantidad': count,
         'Porcentaje': `${((count / stats.users.total) * 100).toFixed(1)}%`,
       }));
 
       // Users by country
       const usersByCountry = Object.entries(stats.users.byCountry)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 20)
         .map(([country, count]) => ({
           'País': country,
           'Usuarios': count,
           'Porcentaje': `${((count / stats.users.total) * 100).toFixed(1)}%`,
         }));
 
       // Content by type
       const contentByType = Object.entries(stats.content.byType).map(([type, count]) => ({
         'Tipo de Contenido': CONTENT_TYPE_LABELS[type] || type,
         'Cantidad': count,
         'Porcentaje': `${((count / stats.content.total) * 100).toFixed(1)}%`,
       }));
 
       // Timeline
       const timeline = stats.timeline.map(t => ({
         'Fecha': t.date,
         'Nuevos Usuarios': t.users,
         'Nuevo Contenido': t.content,
         'Interacciones': t.interactions,
       }));
 
       exportToExcel([
         { name: 'Resumen', data: summary },
         { name: 'Usuarios por Tipo', data: usersByType },
         { name: 'Usuarios por País', data: usersByCountry },
         { name: 'Contenido por Tipo', data: contentByType },
         { name: 'Timeline', data: timeline },
       ], `informe_${period}_${format(new Date(), 'yyyy-MM-dd')}`);
 
       toast({
         title: "Exportación exitosa",
         description: "Se descargó el informe en formato Excel",
       });
     } catch (error) {
       console.error('Error exporting:', error);
       toast({
         title: "Error",
         description: "No se pudo exportar el informe",
         variant: "destructive",
       });
     }
   };
 
   if (loading || loadingStats) {
     return (
       <div className="flex justify-center items-center min-h-screen">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!user || !isAdmin) {
     return <Navigate to="/foro" replace />;
   }
 
   const userTypeData = stats ? Object.entries(stats.users.byType).map(([name, value]) => ({
     name: PROFILE_TYPE_LABELS[name] || name,
     value,
   })) : [];
 
   const contentTypeData = stats ? Object.entries(stats.content.byType).map(([name, value]) => ({
     name: CONTENT_TYPE_LABELS[name] || name,
     value,
   })) : [];
 
   const contentStatusData = stats ? [
     { name: 'Aprobado', value: stats.content.approved, color: '#10b981' },
     { name: 'Pendiente', value: stats.content.pending, color: '#f59e0b' },
     { name: 'Rechazado', value: stats.content.rejected, color: '#ef4444' },
   ].filter(d => d.value > 0) : [];
 
   return (
     <AdminLayout>
       <div className="max-w-7xl mx-auto space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <div>
             <h2 className="text-3xl font-bold mb-2">Informes de Plataforma</h2>
             <p className="text-muted-foreground">
               Análisis completo de actividad y métricas
             </p>
           </div>
           <div className="flex items-center gap-3">
             <Button onClick={handleExportReport} variant="outline" className="gap-2">
               <Download className="w-4 h-4" />
               Exportar Excel
             </Button>
           </div>
         </div>
 
         {/* Period Selector */}
         <Card>
           <CardContent className="pt-6">
             <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
               <TabsList className="grid w-full grid-cols-4">
                 <TabsTrigger value="weekly" className="gap-2">
                   <Calendar className="w-4 h-4" />
                   Semanal
                 </TabsTrigger>
                 <TabsTrigger value="biweekly" className="gap-2">
                   <Calendar className="w-4 h-4" />
                   Quincenal
                 </TabsTrigger>
                 <TabsTrigger value="monthly" className="gap-2">
                   <Calendar className="w-4 h-4" />
                   Mensual
                 </TabsTrigger>
                 <TabsTrigger value="yearly" className="gap-2">
                   <Calendar className="w-4 h-4" />
                   Anual
                 </TabsTrigger>
               </TabsList>
             </Tabs>
           </CardContent>
         </Card>
 
         {stats && (
           <>
             {/* Summary Cards */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                   <Users className="h-5 w-5 text-cyan-500" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold text-cyan-500">{stats.users.total}</div>
                   <p className="text-xs text-muted-foreground mt-1">
                     +{stats.users.newInPeriod} en {getPeriodLabel(period).toLowerCase()}
                   </p>
                 </CardContent>
               </Card>
 
               <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Contenido</CardTitle>
                   <Video className="h-5 w-5 text-purple-500" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold text-purple-500">{stats.content.total}</div>
                   <p className="text-xs text-muted-foreground mt-1">
                     +{stats.content.newInPeriod} nuevos
                   </p>
                 </CardContent>
               </Card>
 
               <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
                   <Heart className="h-5 w-5 text-green-500" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold text-green-500">
                     {stats.interactions.totalLikes + stats.interactions.totalComments + stats.interactions.totalShares}
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">
                     {stats.interactions.totalViews.toLocaleString()} vistas
                   </p>
                 </CardContent>
               </Card>
 
               <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                   <DollarSign className="h-5 w-5 text-amber-500" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold text-amber-500">
                     ${stats.monetization.totalRevenue.toFixed(0)}
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">
                     +${stats.monetization.revenueInPeriod.toFixed(0)} en período
                   </p>
                 </CardContent>
               </Card>
             </div>
 
             {/* Timeline Chart */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <TrendingUp className="h-5 w-5" />
                   Actividad en el Tiempo
                 </CardTitle>
                 <CardDescription>
                   Evolución de usuarios, contenido e interacciones
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                   <AreaChart data={stats.timeline}>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis 
                       dataKey="date" 
                       tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                     />
                     <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                     <Tooltip 
                       contentStyle={{ 
                         backgroundColor: 'hsl(var(--card))', 
                         border: '1px solid hsl(var(--border))',
                         borderRadius: '8px'
                       }}
                     />
                     <Legend />
                     <Area type="monotone" dataKey="users" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} name="Usuarios" />
                     <Area type="monotone" dataKey="content" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Contenido" />
                     <Area type="monotone" dataKey="interactions" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Interacciones" />
                   </AreaChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
 
             {/* Distribution Charts */}
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {/* Users by Type */}
               <Card>
                 <CardHeader>
                   <CardTitle>Usuarios por Tipo</CardTitle>
                   <CardDescription>Distribución de perfiles</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ResponsiveContainer width="100%" height={250}>
                     <PieChart>
                       <Pie
                         data={userTypeData}
                         cx="50%"
                         cy="50%"
                         outerRadius={80}
                         dataKey="value"
                         label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                         labelLine={false}
                       >
                         {userTypeData.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                 </CardContent>
               </Card>
 
               {/* Content by Type */}
               <Card>
                 <CardHeader>
                   <CardTitle>Contenido por Tipo</CardTitle>
                   <CardDescription>Distribución de formatos</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ResponsiveContainer width="100%" height={250}>
                     <BarChart data={contentTypeData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                       <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                       <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                       <Tooltip />
                       <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </CardContent>
               </Card>
 
               {/* Content Status */}
               <Card>
                 <CardHeader>
                   <CardTitle>Estado de Contenido</CardTitle>
                   <CardDescription>Moderación general</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ResponsiveContainer width="100%" height={250}>
                     <PieChart>
                       <Pie
                         data={contentStatusData}
                         cx="50%"
                         cy="50%"
                         innerRadius={50}
                         outerRadius={80}
                         dataKey="value"
                         label={({ name, value }) => `${name}: ${value}`}
                       >
                         {contentStatusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                 </CardContent>
               </Card>
             </div>
 
             {/* Forum & Interactions Stats */}
             <div className="grid gap-6 md:grid-cols-2">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <MessageSquare className="h-5 w-5" />
                     Actividad del Foro
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-cyan-500">{stats.forum.totalThreads}</p>
                       <p className="text-sm text-muted-foreground">Hilos Totales</p>
                     </div>
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-purple-500">{stats.forum.totalPosts}</p>
                       <p className="text-sm text-muted-foreground">Posts Totales</p>
                     </div>
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-green-500">+{stats.forum.newThreadsInPeriod}</p>
                       <p className="text-sm text-muted-foreground">Nuevos Hilos</p>
                     </div>
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-amber-500">+{stats.forum.newPostsInPeriod}</p>
                       <p className="text-sm text-muted-foreground">Nuevos Posts</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Share2 className="h-5 w-5" />
                     Desglose de Interacciones
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-rose-500">{stats.interactions.totalLikes}</p>
                       <p className="text-sm text-muted-foreground">Likes</p>
                     </div>
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-blue-500">{stats.interactions.totalComments}</p>
                       <p className="text-sm text-muted-foreground">Comentarios</p>
                     </div>
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-green-500">{stats.interactions.totalShares}</p>
                       <p className="text-sm text-muted-foreground">Compartidos</p>
                     </div>
                     <div className="text-center p-4 bg-muted/30 rounded-lg">
                       <p className="text-3xl font-bold text-cyan-500">{stats.interactions.totalViews.toLocaleString()}</p>
                       <p className="text-sm text-muted-foreground">Vistas</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Top Countries */}
             <Card>
               <CardHeader>
                 <CardTitle>Usuarios por País (Top 10)</CardTitle>
                 <CardDescription>Distribución geográfica de la comunidad</CardDescription>
               </CardHeader>
               <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart 
                     data={Object.entries(stats.users.byCountry)
                       .sort((a, b) => b[1] - a[1])
                       .slice(0, 10)
                       .map(([country, count]) => ({ country, count }))}
                   >
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis dataKey="country" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                     <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                     <Tooltip />
                     <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Usuarios" />
                   </BarChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
           </>
         )}
       </div>
     </AdminLayout>
   );
 }
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, TrendingUp, Video, Users, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShareStats {
  totalShares: number;
  totalVideos: number;
  totalUsers: number;
  averageSharesPerVideo: number;
}

interface ShareByPlatform {
  platform: string;
  count: number;
  percentage: number;
}

interface TopSharedVideo {
  id: string;
  title: string;
  shares_count: number;
  content_type: string;
}

interface SharesByDay {
  date: string;
  count: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  telegram: '#0088cc',
  instagram: '#E4405F',
  copy_link: '#6b7280',
  native: '#8b5cf6',
};

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  instagram: 'Instagram',
  copy_link: 'Copiar Link',
  native: 'Compartir Nativo',
};

export default function ShareAnalytics() {
  const { user, loading, isAdmin } = useAuth(true);
  const { toast } = useToast();
  const [stats, setStats] = useState<ShareStats>({ 
    totalShares: 0, 
    totalVideos: 0, 
    totalUsers: 0, 
    averageSharesPerVideo: 0 
  });
  const [sharesByPlatform, setSharesByPlatform] = useState<ShareByPlatform[]>([]);
  const [topVideos, setTopVideos] = useState<TopSharedVideo[]>([]);
  const [sharesByDay, setSharesByDay] = useState<SharesByDay[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dateRange, setDateRange] = useState(30); // últimos 30 días
  const [allSharesData, setAllSharesData] = useState<any[]>([]); // Para exportación

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadAnalytics();
    }
  }, [loading, user, isAdmin, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoadingStats(true);
      const startDate = startOfDay(subDays(new Date(), dateRange));

      // Obtener todos los shares
      const { data: allShares, error: sharesError } = await supabase
        .from('content_shares')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (sharesError) throw sharesError;

      // Guardar datos completos para exportación
      setAllSharesData(allShares || []);

      // Estadísticas generales
      const totalShares = allShares?.length || 0;
      const uniqueVideos = new Set(allShares?.map(s => s.content_id)).size;
      const uniqueUsers = new Set(allShares?.filter(s => s.user_id).map(s => s.user_id)).size;

      setStats({
        totalShares,
        totalVideos: uniqueVideos,
        totalUsers: uniqueUsers,
        averageSharesPerVideo: uniqueVideos > 0 ? totalShares / uniqueVideos : 0,
      });

      // Shares por plataforma
      const platformCounts: Record<string, number> = {};
      allShares?.forEach(share => {
        platformCounts[share.platform] = (platformCounts[share.platform] || 0) + 1;
      });

      const platformData = Object.entries(platformCounts)
        .map(([platform, count]) => ({
          platform: PLATFORM_LABELS[platform] || platform,
          count,
          percentage: (count / totalShares) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      setSharesByPlatform(platformData);

      // Videos más compartidos
      const { data: topSharedVideos, error: topVideosError } = await supabase
        .from('content_uploads')
        .select('id, title, shares_count, content_type')
        .gt('shares_count', 0)
        .order('shares_count', { ascending: false })
        .limit(10);

      if (topVideosError) throw topVideosError;
      setTopVideos(topSharedVideos || []);

      // Shares por día
      const daysCounts: Record<string, number> = {};
      for (let i = dateRange - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        daysCounts[date] = 0;
      }

      allShares?.forEach(share => {
        const date = format(new Date(share.created_at), 'yyyy-MM-dd');
        if (daysCounts[date] !== undefined) {
          daysCounts[date]++;
        }
      });

      const daysData = Object.entries(daysCounts).map(([date, count]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        count,
      }));

      setSharesByDay(daysData);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const exportToCSV = async (type: 'all' | 'platform' | 'videos' | 'daily') => {
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'all':
          // Exportar todos los shares con detalles
          const { data: detailedShares, error } = await supabase
            .from('content_shares')
            .select(`
              id,
              created_at,
              platform,
              content_id,
              content_uploads(title, content_type),
              user_id,
              profiles(username)
            `)
            .gte('created_at', startOfDay(subDays(new Date(), dateRange)).toISOString())
            .order('created_at', { ascending: false });

          if (error) throw error;

          csvContent = 'ID,Fecha,Hora,Plataforma,Video,Tipo de Contenido,Usuario\n';
          detailedShares?.forEach((share: any) => {
            const date = new Date(share.created_at);
            csvContent += `${share.id},${format(date, 'yyyy-MM-dd')},${format(date, 'HH:mm:ss')},${PLATFORM_LABELS[share.platform] || share.platform},"${share.content_uploads?.title || 'N/A'}",${share.content_uploads?.content_type || 'N/A'},${share.profiles?.username || 'Anónimo'}\n`;
          });
          filename = `shares_detallado_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;

        case 'platform':
          csvContent = 'Plataforma,Cantidad,Porcentaje\n';
          sharesByPlatform.forEach((platform) => {
            csvContent += `${platform.platform},${platform.count},${platform.percentage.toFixed(2)}%\n`;
          });
          filename = `shares_por_plataforma_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;

        case 'videos':
          csvContent = 'Posición,Video,Tipo de Contenido,Cantidad de Shares\n';
          topVideos.forEach((video, index) => {
            csvContent += `${index + 1},"${video.title}",${video.content_type},${video.shares_count}\n`;
          });
          filename = `top_videos_compartidos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;

        case 'daily':
          csvContent = 'Fecha,Cantidad de Shares\n';
          sharesByDay.forEach((day) => {
            csvContent += `${day.date},${day.count}\n`;
          });
          filename = `shares_diarios_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
      }

      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast({
        title: "Exportación exitosa",
        description: `Archivo CSV descargado: ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo CSV",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = async () => {
    try {
      // Obtener datos detallados para el Excel
      const { data: detailedShares, error } = await supabase
        .from('content_shares')
        .select(`
          id,
          created_at,
          platform,
          content_id,
          content_uploads(title, content_type),
          user_id,
          profiles(username)
        `)
        .gte('created_at', startOfDay(subDays(new Date(), dateRange)).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Crear workbook con múltiples hojas
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen
      const summaryData = [
        ['Estadísticas de Shares'],
        [''],
        ['Métrica', 'Valor'],
        ['Total de Shares', stats.totalShares],
        ['Videos Compartidos', stats.totalVideos],
        ['Usuarios Activos', stats.totalUsers],
        ['Promedio por Video', stats.averageSharesPerVideo.toFixed(2)],
        [''],
        ['Período', `Últimos ${dateRange} días`],
        ['Fecha de Exportación', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

      // Hoja 2: Shares Detallados
      const detailedData = detailedShares?.map((share: any) => ({
        'ID': share.id,
        'Fecha': format(new Date(share.created_at), 'yyyy-MM-dd'),
        'Hora': format(new Date(share.created_at), 'HH:mm:ss'),
        'Plataforma': PLATFORM_LABELS[share.platform] || share.platform,
        'Video': share.content_uploads?.title || 'N/A',
        'Tipo de Contenido': share.content_uploads?.content_type || 'N/A',
        'Usuario': share.profiles?.username || 'Anónimo',
      })) || [];
      const ws2 = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Shares Detallados');

      // Hoja 3: Por Plataforma
      const platformData = sharesByPlatform.map(p => ({
        'Plataforma': p.platform,
        'Cantidad': p.count,
        'Porcentaje': `${p.percentage.toFixed(2)}%`,
      }));
      const ws3 = XLSX.utils.json_to_sheet(platformData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Por Plataforma');

      // Hoja 4: Top Videos
      const videosData = topVideos.map((v, i) => ({
        'Posición': i + 1,
        'Video': v.title,
        'Tipo': v.content_type,
        'Shares': v.shares_count,
      }));
      const ws4 = XLSX.utils.json_to_sheet(videosData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Top Videos');

      // Hoja 5: Shares Diarios
      const dailyData = sharesByDay.map(d => ({
        'Fecha': d.date,
        'Cantidad': d.count,
      }));
      const ws5 = XLSX.utils.json_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, ws5, 'Shares Diarios');

      // Descargar archivo
      const filename = `estadisticas_shares_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportación exitosa",
        description: `Archivo Excel descargado: ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo Excel",
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

  const pieData = sharesByPlatform.map(item => ({
    name: item.platform,
    value: item.count,
    color: PLATFORM_COLORS[Object.keys(PLATFORM_LABELS).find(key => PLATFORM_LABELS[key] === item.platform) || ''] || '#6b7280',
  }));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <header className="fixed top-0 left-0 right-0 h-14 flex items-center border-b bg-background z-50 px-4">
          <SidebarTrigger />
          <h1 className="ml-4 text-lg font-semibold">Red Akasha - Administración</h1>
        </header>

        <div className="flex w-full pt-14">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Estadísticas de Compartidos</h2>
                  <p className="text-muted-foreground">
                    Análisis de compartidos en redes sociales
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(Number(e.target.value))}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value={7}>Últimos 7 días</option>
                    <option value={30}>Últimos 30 días</option>
                    <option value={90}>Últimos 90 días</option>
                    <option value={365}>Último año</option>
                  </select>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={exportToExcel}>
                        <Download className="w-4 h-4 mr-2" />
                        Excel Completo (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToCSV('all')}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV - Todos los Shares
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToCSV('platform')}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV - Por Plataforma
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToCSV('videos')}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV - Top Videos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToCSV('daily')}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV - Shares Diarios
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                    <Share2 className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.totalShares}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      En {dateRange} días
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Videos Compartidos</CardTitle>
                    <Video className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-500">{stats.totalVideos}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Videos únicos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                    <Users className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Han compartido
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-500">
                      {stats.averageSharesPerVideo.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shares por video
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Shares por plataforma - Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Distribución por Plataforma
                    </CardTitle>
                    <CardDescription>
                      Proporción de shares por red social
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No hay datos disponibles
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shares por plataforma - Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Ranking de Plataformas
                    </CardTitle>
                    <CardDescription>
                      Cantidad de shares por plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sharesByPlatform.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sharesByPlatform}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="platform" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" name="Shares" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No hay datos disponibles
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Shares por día - Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolución de Shares
                  </CardTitle>
                  <CardDescription>
                    Shares por día en los últimos {dateRange} días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sharesByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={sharesByDay}>
                        <defs>
                          <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          interval={Math.floor(dateRange / 10)}
                        />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1}
                          fill="url(#colorShares)"
                          name="Shares"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Videos Compartidos */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Videos Más Compartidos</CardTitle>
                  <CardDescription>
                    Videos con más shares en el período seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topVideos.length > 0 ? (
                    <div className="space-y-3">
                      {topVideos.map((video, index) => (
                        <div 
                          key={video.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{video.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {video.content_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-primary">
                            <Share2 className="w-4 h-4" />
                            <span className="font-bold">{video.shares_count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay videos compartidos
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabla de plataformas con porcentajes */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle por Plataforma</CardTitle>
                  <CardDescription>
                    Distribución detallada de shares por red social
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sharesByPlatform.length > 0 ? (
                    <div className="space-y-3">
                      {sharesByPlatform.map((platform) => (
                        <div 
                          key={platform.platform}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ 
                                backgroundColor: PLATFORM_COLORS[Object.keys(PLATFORM_LABELS).find(key => PLATFORM_LABELS[key] === platform.platform) || ''] || '#6b7280'
                              }}
                            />
                            <span className="font-medium">{platform.platform}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">{platform.count} shares</span>
                            <span className="font-bold text-primary">
                              {platform.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
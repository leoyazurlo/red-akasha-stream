import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle2, XCircle, TrendingUp, BarChart3, Video, AlertCircle, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToCSV, formatDate, CONTENT_TYPE_LABELS, PROFILE_TYPE_LABELS } from "@/lib/exportUtils";

interface ContentStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface ContentByType {
  type: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface RecentContent {
  id: string;
  title: string;
  content_type: string;
  status: string;
  created_at: string;
}

export default function Admin() {
  const { user, loading, isAdmin } = useAuth(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<ContentStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [contentByType, setContentByType] = useState<ContentByType[]>([]);
  const [recentContent, setRecentContent] = useState<RecentContent[]>([]);
  const [allContent, setAllContent] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadDashboardData();
    }
  }, [loading, user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Obtener estadísticas generales
      const { data: contentData, error } = await supabase
        .from('content_uploads')
        .select('id, status, content_type, title, created_at, uploader_id, views_count, likes_count');

      if (error) throw error;

      setAllContent(contentData || []);

      // Calcular estadísticas por estado
      const pending = contentData?.filter(c => c.status === 'pending').length || 0;
      const approved = contentData?.filter(c => c.status === 'approved').length || 0;
      const rejected = contentData?.filter(c => c.status === 'rejected').length || 0;

      setStats({
        pending,
        approved,
        rejected,
        total: contentData?.length || 0,
      });

      // Calcular estadísticas por tipo de contenido
      const typeStats: Record<string, ContentByType> = {};
      contentData?.forEach(content => {
        if (!typeStats[content.content_type]) {
          typeStats[content.content_type] = {
            type: content.content_type,
            pending: 0,
            approved: 0,
            rejected: 0,
          };
        }
        
        if (content.status === 'pending') typeStats[content.content_type].pending++;
        if (content.status === 'approved') typeStats[content.content_type].approved++;
        if (content.status === 'rejected') typeStats[content.content_type].rejected++;
      });

      setContentByType(Object.values(typeStats));

      // Obtener contenido reciente
      const recent = contentData
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          title: c.title,
          content_type: c.content_type,
          status: c.status,
          created_at: c.created_at,
        })) || [];

      setRecentContent(recent);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExportDashboard = async () => {
    try {
      // Obtener datos adicionales para exportación
      const [usersRes, postsRes, threadsRes] = await Promise.all([
        supabase.from('profile_details').select('id, display_name, profile_type, pais, ciudad, created_at'),
        supabase.from('forum_posts').select('id, author_id, created_at'),
        supabase.from('forum_threads').select('id, author_id, title, created_at'),
      ]);

      // Resumen general
      const summaryData = [{
        'Total Contenido': stats.total,
        'Contenido Pendiente': stats.pending,
        'Contenido Aprobado': stats.approved,
        'Contenido Rechazado': stats.rejected,
        'Tasa de Aprobación': `${((stats.approved / stats.total) * 100).toFixed(1)}%`,
        'Total Usuarios': usersRes.data?.length || 0,
        'Total Posts Foro': postsRes.data?.length || 0,
        'Total Hilos Foro': threadsRes.data?.length || 0,
        'Fecha de Exportación': formatDate(new Date().toISOString()),
      }];

      // Contenido por tipo
      const contentByTypeData = contentByType.map(ct => ({
        'Tipo de Contenido': CONTENT_TYPE_LABELS[ct.type] || ct.type,
        'Pendiente': ct.pending,
        'Aprobado': ct.approved,
        'Rechazado': ct.rejected,
        'Total': ct.pending + ct.approved + ct.rejected,
      }));

      // Lista de contenido
      const contentListData = allContent.map(c => ({
        'Título': c.title,
        'Tipo': CONTENT_TYPE_LABELS[c.content_type] || c.content_type,
        'Estado': c.status === 'approved' ? 'Aprobado' : c.status === 'rejected' ? 'Rechazado' : 'Pendiente',
        'Vistas': c.views_count || 0,
        'Likes': c.likes_count || 0,
        'Fecha de Subida': formatDate(c.created_at),
      }));

      // Usuarios por tipo de perfil
      const usersByType = Object.entries(
        (usersRes.data || []).reduce((acc, u) => {
          acc[u.profile_type] = (acc[u.profile_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({
        'Tipo de Perfil': PROFILE_TYPE_LABELS[type] || type,
        'Cantidad': count,
      }));

      // Usuarios por país
      const usersByCountry = Object.entries(
        (usersRes.data || []).reduce((acc, u) => {
          acc[u.pais] = (acc[u.pais] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]).map(([country, count]) => ({
        'País': country,
        'Cantidad': count,
      }));

      exportToExcel([
        { name: 'Resumen General', data: summaryData },
        { name: 'Contenido por Tipo', data: contentByTypeData },
        { name: 'Lista de Contenido', data: contentListData },
        { name: 'Usuarios por Tipo', data: usersByType },
        { name: 'Usuarios por País', data: usersByCountry },
      ], 'dashboard_red_akasha');

      toast({
        title: "Exportación exitosa",
        description: "Se descargó el archivo Excel con todas las estadísticas",
      });
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo",
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

  const COLORS = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  };

  const pieData = [
    { name: 'Pendiente', value: stats.pending, color: COLORS.pending },
    { name: 'Aprobado', value: stats.approved, color: COLORS.approved },
    { name: 'Rechazado', value: stats.rejected, color: COLORS.rejected },
  ].filter(item => item.value > 0);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, label: 'Pendiente', icon: Clock },
      approved: { variant: 'default' as const, label: 'Aprobado', icon: CheckCircle2 },
      rejected: { variant: 'destructive' as const, label: 'Rechazado', icon: XCircle },
    };
    const { variant, label, icon: Icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video_musical_vivo: "Video Musical en Vivo",
      video_clip: "Video Clip",
      podcast: "Podcast",
      corto: "Cortometraje",
      documental: "Documental",
      pelicula: "Película"
    };
    return labels[type] || type;
  };

  const approvalRate = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
  const rejectionRate = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard de Curaduría</h2>
            <p className="text-muted-foreground">
              Estadísticas y métricas de moderación de contenido
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.pending > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <AlertCircle className="w-4 h-4 mr-1" />
                {stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={handleExportDashboard}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel Completo (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
            onClick={() => navigate('/admin/content')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requieren revisión
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {approvalRate.toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-rose-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {rejectionRate.toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Video className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Contenido subido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Distribución por Estado
              </CardTitle>
              <CardDescription>
                Proporción de contenido en cada estado
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

          {/* Bar Chart by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contenido por Tipo
              </CardTitle>
              <CardDescription>
                Distribución por tipo de contenido y estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pending" fill={COLORS.pending} name="Pendiente" />
                    <Bar dataKey="approved" fill={COLORS.approved} name="Aprobado" />
                    <Bar dataKey="rejected" fill={COLORS.rejected} name="Rechazado" />
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

        {/* Recent Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido Reciente</CardTitle>
            <CardDescription>
              Últimas 5 subidas de contenido
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentContent.length > 0 ? (
              <div className="space-y-4">
                {recentContent.map((content) => (
                  <div 
                    key={content.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/content')}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium truncate">{content.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {getContentTypeLabel(content.content_type)} • {new Date(content.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(content.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay contenido reciente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Rate Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Tasa de Aprobación</CardTitle>
            <CardDescription>
              Porcentaje de contenido aprobado vs rechazado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Aprobados</span>
                <span className="text-sm text-muted-foreground">{approvalRate.toFixed(1)}%</span>
              </div>
              <Progress value={approvalRate} className="h-2 [&>div]:bg-green-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Rechazados</span>
                <span className="text-sm text-muted-foreground">{rejectionRate.toFixed(1)}%</span>
              </div>
              <Progress value={rejectionRate} className="h-2 [&>div]:bg-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

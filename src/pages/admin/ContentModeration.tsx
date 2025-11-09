import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader2, CheckCircle2, XCircle, Video, Image, Music } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLog } from "@/hooks/useAuditLog";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  status: string;
  video_url?: string;
  audio_url?: string;
  photo_url?: string;
  band_name?: string;
  producer_name?: string;
  recording_studio?: string;
  venue_name?: string;
  promoter_name?: string;
  created_at: string;
  uploader_id: string;
  is_free: boolean;
  price?: number;
  currency?: string;
}

export default function AdminContentModeration() {
  const { user, loading: authLoading, isAdmin } = useAuth(true);
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadContent();
    }
  }, [authLoading, user, isAdmin, statusFilter]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContentStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const contentItem = content.find(c => c.id === id);
      
      const { error } = await supabase
        .from('content_uploads')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Registrar en el log de auditoría
      await logAction({
        action: newStatus === 'approved' ? 'approve_content' : 'reject_content',
        targetType: 'content',
        targetId: id,
        details: {
          title: contentItem?.title,
          content_type: contentItem?.content_type,
          status: newStatus,
        },
      });

      toast({
        title: newStatus === 'approved' ? "Contenido aprobado" : "Contenido rechazado",
        description: `El contenido ha sido ${newStatus === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`,
      });

      loadContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getContentIcon = (type: string) => {
    if (type === 'podcast') return Music;
    if (type.includes('video')) return Video;
    return Image;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      approved: { variant: 'default', label: 'Aprobado' },
      rejected: { variant: 'destructive', label: 'Rechazado' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/foro" replace />;
  }

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
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Curaduría de Contenido</h2>
                <p className="text-muted-foreground">
                  Revisa y modera el contenido subido por los usuarios
                </p>
              </div>

              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="pending">Pendientes</TabsTrigger>
                  <TabsTrigger value="approved">Aprobados</TabsTrigger>
                  <TabsTrigger value="rejected">Rechazados</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="space-y-4 mt-6">
                  {content.map((item) => {
                    const Icon = getContentIcon(item.content_type);
                    return (
                      <Card key={item.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <Icon className="h-8 w-8 text-primary mt-1" />
                              <div className="flex-1">
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                <CardDescription className="mt-2">
                                  {item.description || 'Sin descripción'}
                                </CardDescription>
                                <div className="flex gap-2 mt-3">
                                  <Badge variant="outline">
                                    {item.content_type.replace('_', ' ')}
                                  </Badge>
                                  {getStatusBadge(item.status)}
                                  {item.is_free ? (
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                                      Gratuito
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                      De Pago: {item.price} {item.currency}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* URLs del contenido */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {item.video_url && (
                              <div>
                                <span className="text-muted-foreground">Video:</span>
                                <a 
                                  href={item.video_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block text-primary hover:underline truncate"
                                >
                                  Ver video
                                </a>
                              </div>
                            )}
                            {item.audio_url && (
                              <div>
                                <span className="text-muted-foreground">Audio:</span>
                                <a 
                                  href={item.audio_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block text-primary hover:underline truncate"
                                >
                                  Escuchar audio
                                </a>
                              </div>
                            )}
                            {item.photo_url && (
                              <div>
                                <span className="text-muted-foreground">Foto:</span>
                                <a 
                                  href={item.photo_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block text-primary hover:underline truncate"
                                >
                                  Ver foto
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Ficha técnica */}
                          {(item.band_name || item.producer_name || item.recording_studio || item.venue_name || item.promoter_name) && (
                            <div className="border-t pt-4">
                              <p className="font-semibold text-sm mb-2">Ficha Técnica:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                {item.band_name && (
                                  <div>
                                    <span className="text-muted-foreground">Banda:</span> {item.band_name}
                                  </div>
                                )}
                                {item.producer_name && (
                                  <div>
                                    <span className="text-muted-foreground">Productor:</span> {item.producer_name}
                                  </div>
                                )}
                                {item.recording_studio && (
                                  <div>
                                    <span className="text-muted-foreground">Estudio:</span> {item.recording_studio}
                                  </div>
                                )}
                                {item.venue_name && (
                                  <div>
                                    <span className="text-muted-foreground">Sala:</span> {item.venue_name}
                                  </div>
                                )}
                                {item.promoter_name && (
                                  <div>
                                    <span className="text-muted-foreground">Promotor:</span> {item.promoter_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Acciones de moderación */}
                          {item.status === 'pending' && (
                            <div className="flex gap-2 pt-4 border-t">
                              <Button
                                onClick={() => updateContentStatus(item.id, 'approved')}
                                variant="default"
                                size="sm"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Aprobar
                              </Button>
                              <Button
                                onClick={() => updateContentStatus(item.id, 'rejected')}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {content.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay contenido {statusFilter === 'pending' ? 'pendiente' : statusFilter === 'approved' ? 'aprobado' : 'rechazado'}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader2, CheckCircle2, XCircle, Video, Image, Music, Trash2, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  
  // Estados para aprobación/rechazo rápido
  const [bulkContentType, setBulkContentType] = useState<string>("all");
  const [bulkDateFrom, setBulkDateFrom] = useState<string>("");
  const [bulkDateTo, setBulkDateTo] = useState<string>("");
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);

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

  const deleteContent = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contenido permanentemente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const contentItem = content.find(c => c.id === id);

      const { error } = await supabase
        .from('content_uploads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Registrar en el log de auditoría
      await logAction({
        action: 'delete_content',
        targetType: 'content',
        targetId: id,
        details: {
          title: contentItem?.title,
          content_type: contentItem?.content_type,
        },
      });

      toast({
        title: "Contenido eliminado",
        description: "El contenido ha sido eliminado permanentemente",
      });

      loadContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contenido",
        variant: "destructive",
      });
    }
  };

  const bulkApproveContent = async () => {
    try {
      setBulkApproving(true);

      // Construir query con filtros
      let query = supabase
        .from('content_uploads')
        .select('id, title, content_type, uploader_id')
        .eq('status', 'pending');
      
      // Aplicar filtro de tipo
      if (bulkContentType !== "all") {
        query = query.eq('content_type', bulkContentType as any);
      }
      
      // Aplicar filtro de fecha desde
      if (bulkDateFrom) {
        query = query.gte('created_at', new Date(bulkDateFrom).toISOString());
      }
      
      // Aplicar filtro de fecha hasta
      if (bulkDateTo) {
        const dateTo = new Date(bulkDateTo);
        dateTo.setHours(23, 59, 59, 999);
        query = query.lte('created_at', dateTo.toISOString());
      }
      
      const { data: itemsToApprove, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!itemsToApprove || itemsToApprove.length === 0) {
        toast({
          title: "Sin contenido",
          description: "No hay contenido pendiente que coincida con los filtros",
        });
        return;
      }
      
      // Aprobar todos los items
      const ids = itemsToApprove.map(item => item.id);
      const { error: updateError } = await supabase
        .from('content_uploads')
        .update({ status: 'approved' })
        .in('id', ids);
      
      if (updateError) throw updateError;
      
      // Registrar en el log de auditoría
      await logAction({
        action: 'approve_content',
        targetType: 'content',
        targetId: 'bulk',
        details: {
          bulk_approval: true,
          count: itemsToApprove.length,
          filters: {
            content_type: bulkContentType,
            date_from: bulkDateFrom,
            date_to: bulkDateTo,
          },
          items: itemsToApprove.map(i => ({ id: i.id, title: i.title })),
        },
      });

      // Crear notificaciones para los creadores
      const uploaderGroups = itemsToApprove.reduce((acc, item) => {
        if (!acc[item.uploader_id]) {
          acc[item.uploader_id] = [];
        }
        acc[item.uploader_id].push(item);
        return acc;
      }, {} as Record<string, typeof itemsToApprove>);

      const notifications = Object.entries(uploaderGroups).map(([uploaderId, items]) => ({
        user_id: uploaderId,
        type: 'content_approved',
        title: 'Contenido Aprobado',
        message: items.length === 1 
          ? `Tu contenido "${items[0].title}" ha sido aprobado y ya está visible en la plataforma.`
          : `${items.length} de tus contenidos han sido aprobados y ya están visibles en la plataforma.`,
        link: '/upload-content',
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creando notificaciones:', notifError);
      }

      toast({
        title: "Aprobación masiva exitosa",
        description: `Se aprobaron ${itemsToApprove.length} contenido(s) y se notificó a ${Object.keys(uploaderGroups).length} creador(es)`,
      });

      // Limpiar filtros y recargar
      setBulkContentType("all");
      setBulkDateFrom("");
      setBulkDateTo("");
      loadContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar la aprobación masiva",
        variant: "destructive",
      });
    } finally {
      setBulkApproving(false);
    }
  };

  const bulkRejectContent = async () => {
    try {
      setBulkRejecting(true);

      // Construir query con filtros
      let query = supabase
        .from('content_uploads')
        .select('id, title, content_type, uploader_id')
        .eq('status', 'pending');
      
      // Aplicar filtro de tipo
      if (bulkContentType !== "all") {
        query = query.eq('content_type', bulkContentType as any);
      }
      
      // Aplicar filtro de fecha desde
      if (bulkDateFrom) {
        query = query.gte('created_at', new Date(bulkDateFrom).toISOString());
      }
      
      // Aplicar filtro de fecha hasta
      if (bulkDateTo) {
        const dateTo = new Date(bulkDateTo);
        dateTo.setHours(23, 59, 59, 999);
        query = query.lte('created_at', dateTo.toISOString());
      }
      
      const { data: itemsToReject, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!itemsToReject || itemsToReject.length === 0) {
        toast({
          title: "Sin contenido",
          description: "No hay contenido pendiente que coincida con los filtros",
        });
        return;
      }
      
      // Rechazar todos los items
      const ids = itemsToReject.map(item => item.id);
      const { error: updateError } = await supabase
        .from('content_uploads')
        .update({ status: 'rejected' })
        .in('id', ids);
      
      if (updateError) throw updateError;
      
      // Registrar en el log de auditoría
      await logAction({
        action: 'reject_content',
        targetType: 'content',
        targetId: 'bulk',
        details: {
          bulk_rejection: true,
          count: itemsToReject.length,
          filters: {
            content_type: bulkContentType,
            date_from: bulkDateFrom,
            date_to: bulkDateTo,
          },
          items: itemsToReject.map(i => ({ id: i.id, title: i.title })),
        },
      });

      // Crear notificaciones para los creadores
      const uploaderGroups = itemsToReject.reduce((acc, item) => {
        if (!acc[item.uploader_id]) {
          acc[item.uploader_id] = [];
        }
        acc[item.uploader_id].push(item);
        return acc;
      }, {} as Record<string, typeof itemsToReject>);

      const notifications = Object.entries(uploaderGroups).map(([uploaderId, items]) => ({
        user_id: uploaderId,
        type: 'content_rejected',
        title: 'Contenido Rechazado',
        message: items.length === 1 
          ? `Tu contenido "${items[0].title}" ha sido rechazado. Por favor revisa que cumpla con los estándares de la plataforma.`
          : `${items.length} de tus contenidos han sido rechazados. Por favor revisa que cumplan con los estándares de la plataforma.`,
        link: '/upload-content',
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creando notificaciones:', notifError);
      }
      
      toast({
        title: "Rechazo masivo exitoso",
        description: `Se rechazaron ${itemsToReject.length} contenido(s) y se notificó a ${Object.keys(uploaderGroups).length} creador(es)`,
        variant: "destructive",
      });
      
      // Limpiar filtros y recargar
      setBulkContentType("all");
      setBulkDateFrom("");
      setBulkDateTo("");
      loadContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar el rechazo masivo",
        variant: "destructive",
      });
    } finally {
      setBulkRejecting(false);
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

              {/* Panel de Aprobación Rápida */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle>Aprobación Rápida</CardTitle>
                  </div>
                  <CardDescription>
                    Aplica filtros y aprueba contenido pendiente masivamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Filtro por tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="bulk-type">Tipo de contenido</Label>
                      <Select value={bulkContentType} onValueChange={setBulkContentType}>
                        <SelectTrigger id="bulk-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los tipos</SelectItem>
                          <SelectItem value="video_musical_vivo">Video Musical en Vivo</SelectItem>
                          <SelectItem value="video_clip">Video Clip</SelectItem>
                          <SelectItem value="podcast">Podcast</SelectItem>
                          <SelectItem value="corto">Cortometraje</SelectItem>
                          <SelectItem value="documental">Documental</SelectItem>
                          <SelectItem value="pelicula">Película</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fecha desde */}
                    <div className="space-y-2">
                      <Label htmlFor="bulk-date-from">Fecha desde</Label>
                      <Input
                        id="bulk-date-from"
                        type="date"
                        value={bulkDateFrom}
                        onChange={(e) => setBulkDateFrom(e.target.value)}
                      />
                    </div>

                    {/* Fecha hasta */}
                    <div className="space-y-2">
                      <Label htmlFor="bulk-date-to">Fecha hasta</Label>
                      <Input
                        id="bulk-date-to"
                        type="date"
                        value={bulkDateTo}
                        onChange={(e) => setBulkDateTo(e.target.value)}
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2 md:col-span-2">
                      <Label className="invisible">Acciones</Label>
                      <div className="flex gap-2">
                        {/* Aprobar Todo */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              className="flex-1" 
                              disabled={bulkApproving || bulkRejecting}
                            >
                              {bulkApproving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Aprobando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Aprobar Todo
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Aprobar contenido masivamente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción aprobará todo el contenido pendiente que coincida con los filtros seleccionados:
                                <div className="mt-3 space-y-1 text-sm font-medium">
                                  <div>• Tipo: {bulkContentType === "all" ? "Todos" : bulkContentType}</div>
                                  {bulkDateFrom && <div>• Desde: {bulkDateFrom}</div>}
                                  {bulkDateTo && <div>• Hasta: {bulkDateTo}</div>}
                                </div>
                                <p className="mt-3 text-muted-foreground font-normal">
                                  Esta acción no se puede deshacer. Asegúrate de revisar los filtros antes de continuar.
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={bulkApproveContent}>
                                Aprobar Todo
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Rechazar Todo */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              className="flex-1" 
                              disabled={bulkApproving || bulkRejecting}
                            >
                              {bulkRejecting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Rechazando...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rechazar Todo
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Rechazar contenido masivamente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción rechazará todo el contenido pendiente que coincida con los filtros seleccionados:
                                <div className="mt-3 space-y-1 text-sm font-medium">
                                  <div>• Tipo: {bulkContentType === "all" ? "Todos" : bulkContentType}</div>
                                  {bulkDateFrom && <div>• Desde: {bulkDateFrom}</div>}
                                  {bulkDateTo && <div>• Hasta: {bulkDateTo}</div>}
                                </div>
                                <p className="mt-3 text-destructive font-normal">
                                  Esta acción rechazará permanentemente el contenido. Asegúrate de revisar los filtros antes de continuar.
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={bulkRejectContent}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Rechazar Todo
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                          <div className="flex gap-2 pt-4 border-t">
                            {item.status === 'pending' && (
                              <>
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
                              </>
                            )}
                            <Button
                              onClick={() => deleteContent(item.id)}
                              variant="outline"
                              size="sm"
                              className="ml-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
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

import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, CheckCircle2, XCircle, Video, Image as ImageIcon, Music, Trash2, Zap, FileVideo } from "lucide-react";
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Checkbox } from "@/components/ui/checkbox";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  status: string;
  video_url?: string;
  audio_url?: string;
  photo_url?: string;
  thumbnail_url?: string;
  thumbnail_small?: string;
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
  const [rejectionReason, setRejectionReason] = useState<string>("no_especificada");
  const [previewItems, setPreviewItems] = useState<ContentItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showApprovalPreview, setShowApprovalPreview] = useState(false);
  const [showRejectionPreview, setShowRejectionPreview] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadContent();
    }
  }, [authLoading, user, isAdmin, statusFilter]);

  const loadPreviewContent = async () => {
    try {
      setPreviewLoading(true);
      setPreviewItems([]);

      // Construir query con filtros
      let query = supabase
        .from('content_uploads')
        .select('id, title, description, content_type, status, is_free, thumbnail_url, thumbnail_small, video_url, audio_url, photo_url, uploader_id, created_at')
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

      const { data: items, error } = await query.limit(20);

      if (error) throw error;

      if (!items || items.length === 0) {
        toast({
          title: "Sin contenido",
          description: "No hay contenido pendiente que coincida con los filtros",
        });
        return;
      }

      setPreviewItems(items as ContentItem[]);
      // Seleccionar todos los items por defecto
      setSelectedItems(new Set(items.map(item => item.id)));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la vista previa",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

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

      // Filtrar solo los items seleccionados
      const selectedIds = Array.from(selectedItems);
      
      if (selectedIds.length === 0) {
        toast({
          title: "Sin selección",
          description: "Debes seleccionar al menos un contenido para aprobar",
        });
        return;
      }

      // Obtener los detalles completos de los items seleccionados
      const { data: itemsToApprove, error: fetchError } = await supabase
        .from('content_uploads')
        .select('id, title, content_type, uploader_id')
        .in('id', selectedIds);
      
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

      // Filtrar solo los items seleccionados
      const selectedIds = Array.from(selectedItems);
      
      if (selectedIds.length === 0) {
        toast({
          title: "Sin selección",
          description: "Debes seleccionar al menos un contenido para rechazar",
        });
        return;
      }

      // Obtener los detalles completos de los items seleccionados
      const { data: itemsToReject, error: fetchError } = await supabase
        .from('content_uploads')
        .select('id, title, content_type, uploader_id')
        .in('id', selectedIds);
      
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

      const rejectionReasons: Record<string, string> = {
        no_especificada: 'No cumple con los estándares de la plataforma',
        baja_calidad: 'Baja calidad de audio/video',
        contenido_inapropiado: 'Contenido inapropiado o que viola las normas',
        derechos_autor: 'Posible violación de derechos de autor',
        informacion_incompleta: 'Información incompleta o incorrecta',
        contenido_duplicado: 'Contenido duplicado',
      };

      const reasonText = rejectionReasons[rejectionReason] || rejectionReasons.no_especificada;

      const notifications = Object.entries(uploaderGroups).map(([uploaderId, items]) => ({
        user_id: uploaderId,
        type: 'content_rejected',
        title: 'Contenido Rechazado',
        message: items.length === 1 
          ? `Tu contenido "${items[0].title}" ha sido rechazado. Motivo: ${reasonText}.`
          : `${items.length} de tus contenidos han sido rechazados. Motivo: ${reasonText}.`,
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
      setRejectionReason("no_especificada");
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
    return ImageIcon;
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
    <AdminLayout>
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
                  <div className="space-y-4">
                    {/* Primera fila: filtros básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>

                    {/* Segunda fila: razón de rechazo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Motivo de rechazo</Label>
                        <Select value={rejectionReason} onValueChange={setRejectionReason}>
                          <SelectTrigger id="rejection-reason">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_especificada">No cumple con los estándares</SelectItem>
                            <SelectItem value="baja_calidad">Baja calidad de audio/video</SelectItem>
                            <SelectItem value="contenido_inapropiado">Contenido inapropiado</SelectItem>
                            <SelectItem value="derechos_autor">Posible violación de derechos</SelectItem>
                            <SelectItem value="informacion_incompleta">Información incompleta</SelectItem>
                            <SelectItem value="contenido_duplicado">Contenido duplicado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tercera fila: botones de acción */}
                    <div className="space-y-2">
                      <Label className="invisible">Acciones</Label>
                      <div className="flex gap-2">
                        {/* Vista Previa para Aprobar */}
                        <Button 
                          className="flex-1" 
                          disabled={bulkApproving || bulkRejecting || previewLoading}
                          onClick={async () => {
                            await loadPreviewContent();
                            if (previewItems.length > 0) {
                              setShowApprovalPreview(true);
                            }
                          }}
                        >
                          {previewLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Aprobar Todo
                            </>
                          )}
                        </Button>

                        {/* Vista Previa para Rechazar */}
                        <Button 
                          variant="destructive"
                          className="flex-1" 
                          disabled={bulkApproving || bulkRejecting || previewLoading}
                          onClick={async () => {
                            await loadPreviewContent();
                            if (previewItems.length > 0) {
                              setShowRejectionPreview(true);
                            }
                          }}
                        >
                          {previewLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar Todo
                            </>
                          )}
                        </Button>

                        {/* Dialog de Aprobación */}
                        <AlertDialog open={showApprovalPreview} onOpenChange={setShowApprovalPreview}>
                          <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Vista Previa - Aprobar Contenido</AlertDialogTitle>
                              <AlertDialogDescription>
                                {selectedItems.size} de {previewItems.length} contenido(s) seleccionado(s). Desmarca los que quieras excluir:
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            {/* Controles de selección */}
                            <div className="flex gap-2 pb-2 border-b">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems(new Set(previewItems.map(i => i.id)))}
                              >
                                Seleccionar todos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems(new Set())}
                              >
                                Deseleccionar todos
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-4">
                              {previewItems.map((item) => (
                                <div 
                                  key={item.id} 
                                  className={`border rounded-lg p-2 space-y-2 cursor-pointer transition-all ${
                                    selectedItems.has(item.id) ? 'ring-2 ring-primary' : 'opacity-60'
                                  }`}
                                  onClick={() => {
                                    const newSelected = new Set(selectedItems);
                                    if (newSelected.has(item.id)) {
                                      newSelected.delete(item.id);
                                    } else {
                                      newSelected.add(item.id);
                                    }
                                    setSelectedItems(newSelected);
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <Checkbox
                                      checked={selectedItems.has(item.id)}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(selectedItems);
                                        if (checked) {
                                          newSelected.add(item.id);
                                        } else {
                                          newSelected.delete(item.id);
                                        }
                                        setSelectedItems(newSelected);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                      <AspectRatio ratio={16/9} className="bg-muted rounded overflow-hidden">
                                        {item.thumbnail_url || item.thumbnail_small ? (
                                          <img 
                                            src={item.thumbnail_url || item.thumbnail_small || ''} 
                                            alt={item.title}
                                            className="object-cover w-full h-full"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-muted">
                                            {item.content_type === 'video_musical_vivo' || item.content_type === 'video_clip' ? (
                                              <FileVideo className="h-8 w-8 text-muted-foreground" />
                                            ) : item.content_type === 'podcast' ? (
                                              <Music className="h-8 w-8 text-muted-foreground" />
                                            ) : (
                                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                          </div>
                                        )}
                                      </AspectRatio>
                                    </div>
                                  </div>
                                  <div className="space-y-1 pl-6">
                                    <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                                    <Badge variant="outline" className="text-xs">
                                      {item.content_type}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {previewItems.length >= 20 && (
                              <p className="text-sm text-muted-foreground">
                                Mostrando los primeros 20 resultados. Puede haber más contenido que coincida con los filtros.
                              </p>
                            )}

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  setShowApprovalPreview(false);
                                  bulkApproveContent();
                                }}
                                disabled={bulkApproving || selectedItems.size === 0}
                              >
                                {bulkApproving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Aprobando...
                                  </>
                                ) : (
                                  `Aprobar ${selectedItems.size} contenido(s)`
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Dialog de Rechazo */}
                        <AlertDialog open={showRejectionPreview} onOpenChange={setShowRejectionPreview}>
                          <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Vista Previa - Rechazar Contenido</AlertDialogTitle>
                              <AlertDialogDescription>
                                {selectedItems.size} de {previewItems.length} contenido(s) seleccionado(s). Motivo: <span className="font-semibold text-destructive">
                                  {rejectionReason === "no_especificada" ? "No cumple con los estándares" :
                                   rejectionReason === "baja_calidad" ? "Baja calidad de audio/video" :
                                   rejectionReason === "contenido_inapropiado" ? "Contenido inapropiado" :
                                   rejectionReason === "derechos_autor" ? "Posible violación de derechos" :
                                   rejectionReason === "informacion_incompleta" ? "Información incompleta" :
                                   rejectionReason === "contenido_duplicado" ? "Contenido duplicado" :
                                   "No cumple con los estándares"}
                                </span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            {/* Controles de selección */}
                            <div className="flex gap-2 pb-2 border-b">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems(new Set(previewItems.map(i => i.id)))}
                              >
                                Seleccionar todos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems(new Set())}
                              >
                                Deseleccionar todos
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-4">
                              {previewItems.map((item) => (
                                <div 
                                  key={item.id} 
                                  className={`border rounded-lg p-2 space-y-2 cursor-pointer transition-all ${
                                    selectedItems.has(item.id) ? 'ring-2 ring-destructive' : 'opacity-60'
                                  }`}
                                  onClick={() => {
                                    const newSelected = new Set(selectedItems);
                                    if (newSelected.has(item.id)) {
                                      newSelected.delete(item.id);
                                    } else {
                                      newSelected.add(item.id);
                                    }
                                    setSelectedItems(newSelected);
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <Checkbox
                                      checked={selectedItems.has(item.id)}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(selectedItems);
                                        if (checked) {
                                          newSelected.add(item.id);
                                        } else {
                                          newSelected.delete(item.id);
                                        }
                                        setSelectedItems(newSelected);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                      <AspectRatio ratio={16/9} className="bg-muted rounded overflow-hidden">
                                        {item.thumbnail_url || item.thumbnail_small ? (
                                          <img 
                                            src={item.thumbnail_url || item.thumbnail_small || ''} 
                                            alt={item.title}
                                            className="object-cover w-full h-full"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-muted">
                                            {item.content_type === 'video_musical_vivo' || item.content_type === 'video_clip' ? (
                                              <FileVideo className="h-8 w-8 text-muted-foreground" />
                                            ) : item.content_type === 'podcast' ? (
                                              <Music className="h-8 w-8 text-muted-foreground" />
                                            ) : (
                                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                          </div>
                                        )}
                                      </AspectRatio>
                                    </div>
                                  </div>
                                  <div className="space-y-1 pl-6">
                                    <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                                    <Badge variant="outline" className="text-xs">
                                      {item.content_type}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {previewItems.length >= 20 && (
                              <p className="text-sm text-muted-foreground">
                                Mostrando los primeros 20 resultados. Puede haber más contenido que coincida con los filtros.
                              </p>
                            )}

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  setShowRejectionPreview(false);
                                  bulkRejectContent();
                                }}
                                disabled={bulkRejecting || selectedItems.size === 0}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {bulkRejecting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Rechazando...
                                  </>
                                ) : (
                                  `Rechazar ${selectedItems.size} contenido(s)`
                                )}
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
        </AdminLayout>
      );
}

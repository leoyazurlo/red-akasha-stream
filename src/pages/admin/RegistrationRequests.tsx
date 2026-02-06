import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, CheckCircle2, XCircle, Clock, User, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
interface RegistrationRequest {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  pais: string;
  provincia?: string;
  ciudad: string;
  perfil?: string[];
  que_buscas?: string[];
  areas_interes?: string[];
  motivacion: string;
  status: string;
  created_at: string;
}

export default function AdminRegistrationRequests() {
  const { user, loading: authLoading, isAdmin } = useAuth(true);
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Approval state
  const [approvingId, setApprovingId] = useState<string | null>(null);
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadRequests();
    }
  }, [authLoading, user, isAdmin, statusFilter]);

  const handleApprove = async (request: RegistrationRequest) => {
    setApprovingId(request.id);
    try {
      const response = await supabase.functions.invoke('approve-registration', {
        body: {
          requestId: request.id,
          avatar_url: null,
        }
      });

      if (response.error) {
        const err: any = response.error;
        let msg = err?.message || 'Error al aprobar la solicitud';
        try {
          if (err?.context?.json) {
            const body = await err.context.json();
            if (body?.error) msg = body.error;
          }
        } catch {
          // ignore parsing errors
        }
        throw new Error(msg);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al aprobar la solicitud');
      }

      // Log the action
      await logAction({
        action: 'approve_request',
        targetType: 'registration_request',
        targetId: request.id,
        details: {
          nombre: request.nombre,
          email: request.email,
          pais: request.pais,
          status: 'approved',
          user_id: response.data.user_id,
        },
      });

      // Show success with password
      const tempPassword = response.data.temp_password;
      toast({
        title: "¡Usuario aprobado!",
        description: `${request.nombre} ha sido aprobado. Contraseña temporal: ${tempPassword}`,
        duration: 30000,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              navigator.clipboard.writeText(tempPassword);
              toast({ title: "Contraseña copiada" });
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        ),
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error al aprobar",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectDialog = (request: RegistrationRequest) => {
    setRequestToReject(request);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!requestToReject || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    setRejectingId(requestToReject.id);
    try {
      // Update the request status and store rejection reason
      const { error } = await supabase
        .from('registration_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestToReject.id);

      if (error) throw error;

      // Log the action
      await logAction({
        action: 'reject_request',
        targetType: 'registration_request',
        targetId: requestToReject.id,
        details: {
          nombre: requestToReject.nombre,
          email: requestToReject.email,
          pais: requestToReject.pais,
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
        },
      });

      // Try to send rejection email (will gracefully fail if Resend not configured)
      try {
        const emailResponse = await supabase.functions.invoke('send-rejection-email', {
          body: {
            email: requestToReject.email,
            nombre: requestToReject.nombre,
            motivo: rejectionReason.trim(),
          }
        });
        
        if (emailResponse.data?.success) {
          toast({
            title: "Solicitud rechazada",
            description: "La solicitud ha sido rechazada y se ha enviado un email al usuario.",
          });
        } else {
          toast({
            title: "Solicitud rechazada",
            description: emailResponse.data?.message || "La solicitud ha sido rechazada (email no enviado - servicio no configurado)",
          });
        }
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
        toast({
          title: "Solicitud rechazada",
          description: "La solicitud ha sido rechazada pero no se pudo enviar el email de notificación.",
        });
      }

      setRejectDialogOpen(false);
      setRequestToReject(null);
      setRejectionReason("");
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    } finally {
      setRejectingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string, icon: any }> = {
      pending: { variant: 'secondary', label: 'Pendiente', icon: Clock },
      approved: { variant: 'default', label: 'Aprobada', icon: CheckCircle2 },
      rejected: { variant: 'destructive', label: 'Rechazada', icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getProfileLabel = (value: string) => {
    const labels: Record<string, string> = {
      amante_de_la_musica: "Amante de la música",
      agrupacion_musical: "Agrupación musical",
      arte_digital: "Arte digital",
      danza: "Danza",
      dj: "DJ",
      estudio_grabacion: "Estudio de grabación",
      management: "Management",
      marketing_digital: "Marketing digital",
      musico: "Músico",
      percusion: "Percusión",
      productor_artistico: "Productor artístico",
      productor_audiovisual: "Productor audiovisual",
      promotor_artistico: "Promotor artístico",
      representante: "Representante",
      sala_concierto: "Sala de concierto",
      sello_discografico: "Sello discográfico",
      vj: "VJ",
    };
    return labels[value] || value;
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
          <h2 className="text-3xl font-bold mb-2">Solicitudes de Registro</h2>
          <p className="text-muted-foreground">
            Revisa y aprueba las solicitudes de nuevos usuarios. El proceso de aprobación garantiza la veracidad de cada perfil.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Nota:</strong> Al aprobar una solicitud, se creará automáticamente el usuario con una contraseña temporal que deberás comunicar al solicitante.
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Aprobadas
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rechazadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4 mt-6">
            {requests.map((request) => (
              <Card key={request.id} className="hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{request.nombre}</CardTitle>
                        <CardDescription className="mt-1">
                          {request.email}
                        </CardDescription>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {getStatusBadge(request.status)}
                          <Badge variant="outline">
                            {new Date(request.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <p className="font-medium">{request.telefono || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ubicación:</span>
                      <p className="font-medium">
                        {request.ciudad}, {request.provincia ? `${request.provincia}, ` : ''}{request.pais}
                      </p>
                    </div>
                  </div>

                  {request.perfil && request.perfil.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tipo(s) de perfil:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.perfil.map((p, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5">
                            {getProfileLabel(p)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Motivación:</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{request.motivacion}</p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={approvingId === request.id}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        {approvingId === request.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Aprobando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Aprobar
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(request)}
                        disabled={approvingId === request.id || rejectingId === request.id}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        {rejectingId === request.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Rechazando...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Rechazar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  {statusFilter === 'pending' ? <Clock className="w-8 h-8" /> : 
                   statusFilter === 'approved' ? <CheckCircle2 className="w-8 h-8" /> : 
                   <XCircle className="w-8 h-8" />}
                </div>
                <p>No hay solicitudes {statusFilter === 'pending' ? 'pendientes' : statusFilter === 'approved' ? 'aprobadas' : 'rechazadas'}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>

      {/* Rejection Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Confirmar Rechazo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Estás a punto de rechazar la solicitud de <strong>{requestToReject?.nombre}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <label htmlFor="rejection-reason" className="text-sm font-medium">
              Motivo del rechazo <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="rejection-reason"
              placeholder="Escribe el motivo por el cual rechazas esta solicitud. Este mensaje será enviado al usuario por email."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Este motivo se guardará y se enviará por email al solicitante.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setRejectDialogOpen(false);
                setRequestToReject(null);
                setRejectionReason("");
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Rechazando...
                </>
              ) : (
                "Confirmar Rechazo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

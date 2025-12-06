import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLog } from "@/hooks/useAuditLog";

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

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadRequests();
    }
  }, [authLoading, user, isAdmin, statusFilter]);

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

  const updateRequestStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const request = requests.find(r => r.id === id);
      
      const { error } = await supabase
        .from('registration_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Registrar en el log de auditoría
      await logAction({
        action: newStatus === 'approved' ? 'approve_request' : 'reject_request',
        targetType: 'registration_request',
        targetId: id,
        details: {
          nombre: request?.nombre,
          email: request?.email,
          pais: request?.pais,
          status: newStatus,
        },
      });

      toast({
        title: newStatus === 'approved' ? "Solicitud aprobada" : "Solicitud rechazada",
        description: `La solicitud ha sido ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`,
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      approved: { variant: 'default', label: 'Aprobada' },
      rejected: { variant: 'destructive', label: 'Rechazada' },
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
          <h2 className="text-3xl font-bold mb-2">Solicitudes de Registro</h2>
          <p className="text-muted-foreground">
            Revisa y aprueba las solicitudes de nuevos usuarios
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
                  <TabsTrigger value="pending">Pendientes</TabsTrigger>
                  <TabsTrigger value="approved">Aprobadas</TabsTrigger>
                  <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="space-y-4 mt-6">
                  {requests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{request.nombre}</CardTitle>
                            <CardDescription className="mt-1">
                              {request.email}
                            </CardDescription>
                            <div className="flex gap-2 mt-3">
                              {getStatusBadge(request.status)}
                              <Badge variant="outline">
                                {new Date(request.created_at).toLocaleDateString()}
                              </Badge>
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
                            <p className="text-sm text-muted-foreground mb-2">Perfil(es):</p>
                            <div className="flex flex-wrap gap-2">
                              {request.perfil.map((p, idx) => (
                                <Badge key={idx} variant="outline">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.areas_interes && request.areas_interes.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Áreas de interés:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.areas_interes.map((area, idx) => (
                                <Badge key={idx} variant="secondary">{area}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.que_buscas && request.que_buscas.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Qué busca:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.que_buscas.map((busca, idx) => (
                                <Badge key={idx} variant="secondary">{busca}</Badge>
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
                              onClick={() => updateRequestStatus(request.id, 'approved')}
                              variant="default"
                              size="sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button
                              onClick={() => updateRequestStatus(request.id, 'rejected')}
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
                  ))}

                  {requests.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay solicitudes {statusFilter === 'pending' ? 'pendientes' : statusFilter === 'approved' ? 'aprobadas' : 'rechazadas'}
                    </div>
                  )}
                </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    );
}

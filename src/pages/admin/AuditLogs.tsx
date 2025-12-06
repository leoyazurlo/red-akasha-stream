import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, FileText, User, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: any;
  user_agent: string;
  created_at: string;
}

export default function AdminAuditLogs() {
  const { user, loading: authLoading, isAdmin } = useAuth(true);
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadLogs();
    }
  }, [authLoading, user, isAdmin, filterAction, filterTarget]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterAction !== "all") {
        query = query.eq('action_type', filterAction);
      }

      if (filterTarget !== "all") {
        query = query.eq('target_type', filterTarget);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      approve_content: { variant: 'default', label: 'Contenido Aprobado' },
      reject_content: { variant: 'destructive', label: 'Contenido Rechazado' },
      delete_user: { variant: 'destructive', label: 'Usuario Eliminado' },
      approve_request: { variant: 'default', label: 'Solicitud Aprobada' },
      reject_request: { variant: 'destructive', label: 'Solicitud Rechazada' },
      update_content: { variant: 'secondary', label: 'Contenido Actualizado' },
      delete_content: { variant: 'destructive', label: 'Contenido Eliminado' },
    };
    const config = badges[action] || { variant: 'outline' as const, label: action };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'content':
        return FileText;
      case 'user':
        return User;
      case 'registration_request':
        return UserCheck;
      default:
        return FileText;
    }
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
          <h2 className="text-3xl font-bold mb-2">Registro de Auditoría</h2>
          <p className="text-muted-foreground">
            Historial de todas las acciones administrativas realizadas en la plataforma
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tipo de Acción</label>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="approve_content">Contenido Aprobado</SelectItem>
                <SelectItem value="reject_content">Contenido Rechazado</SelectItem>
                <SelectItem value="delete_user">Usuario Eliminado</SelectItem>
                <SelectItem value="approve_request">Solicitud Aprobada</SelectItem>
                <SelectItem value="reject_request">Solicitud Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tipo de Objetivo</label>
            <Select value={filterTarget} onValueChange={setFilterTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="content">Contenido</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="registration_request">Solicitud de Registro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="space-y-3">
          {logs.map((log) => {
            const Icon = getTargetIcon(log.target_type);
            const adminId = log.admin_id.substring(0, 8);
            
            return (
              <Card key={log.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action_type)}
                        <Badge variant="outline">{log.target_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          por Admin <code className="bg-muted px-1 rounded text-xs">{adminId}</code>
                        </span>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Fecha:</span>{' '}
                          {new Date(log.created_at).toLocaleString('es-ES', {
                            dateStyle: 'long',
                            timeStyle: 'medium',
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">ID del objetivo:</span>{' '}
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">
                            {log.target_id.substring(0, 8)}...
                          </code>
                        </p>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                          <p className="font-medium mb-1">Detalles:</p>
                          <pre className="overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay registros de auditoría con los filtros seleccionados
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

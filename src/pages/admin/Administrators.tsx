import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Users, ShieldCheck, ShieldAlert } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  email?: string;
}

const roleLabels: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: "Administrador", color: "bg-red-500", icon: ShieldAlert },
  moderator: { label: "Moderador", color: "bg-amber-500", icon: ShieldCheck },
  producer: { label: "Productor", color: "bg-purple-500", icon: Shield },
  streamer: { label: "Streamer", color: "bg-blue-500", icon: Shield },
  user: { label: "Usuario", color: "bg-slate-500", icon: Users },
};

const Administrators = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'moderator' | 'producer' | 'streamer'>('moderator');
  const [adding, setAdding] = useState(false);

  const loadUserRoles = async () => {
    try {
      setLoading(true);
      
      // Get all user roles (admin, moderator, producer, streamer)
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'moderator', 'producer', 'streamer']);

      if (error) throw error;

      // Get profiles for each user
      const rolesWithProfiles: UserRole[] = [];
      
      for (const role of roles || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', role.user_id)
          .single();

        rolesWithProfiles.push({
          ...role,
          profile: profile || undefined,
        });
      }

      setUserRoles(rolesWithProfiles);
    } catch (error) {
      console.error('Error loading user roles:', error);
      toast.error('Error al cargar los administradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserRoles();
  }, []);

  const handleAddRole = async () => {
    if (!newEmail.trim()) {
      toast.error('Ingresa un email válido');
      return;
    }

    try {
      setAdding(true);

      // Find user by email in profiles or auth
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .ilike('username', newEmail.trim());

      // Try to find by registration request email
      const { data: registrations } = await supabase
        .from('registration_requests')
        .select('user_id, email')
        .eq('email', newEmail.trim())
        .eq('status', 'approved')
        .single();

      let userId: string | null = null;

      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
      } else if (registrations?.user_id) {
        userId = registrations.user_id;
      }

      if (!userId) {
        toast.error('Usuario no encontrado. Asegúrate de que el usuario esté registrado.');
        return;
      }

      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', newRole)
        .single();

      if (existingRole) {
        toast.error('El usuario ya tiene este rol asignado');
        return;
      }

      // Add the role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
        });

      if (insertError) throw insertError;

      toast.success(`Rol de ${roleLabels[newRole]?.label || newRole} asignado correctamente`);
      setNewEmail('');
      loadUserRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Error al asignar el rol');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success(`Rol de ${roleLabels[roleName]?.label || roleName} removido`);
      loadUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Error al remover el rol');
    }
  };

  const adminCount = userRoles.filter(r => r.role === 'admin').length;
  const moderatorCount = userRoles.filter(r => r.role === 'moderator').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Administradores y Colaboradores
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los usuarios con acceso al panel de administración
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRoles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Moderadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderatorCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add new collaborator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Agregar Colaborador
            </CardTitle>
            <CardDescription>
              Asigna roles de administración a usuarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Email o nombre de usuario"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                      Moderador
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="producer">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Productor
                    </div>
                  </SelectItem>
                  <SelectItem value="streamer">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Streamer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddRole} disabled={adding}>
                {adding ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Moderador:</strong> Puede moderar contenido y foros. <br />
              <strong>Administrador:</strong> Acceso completo al panel de administración. <br />
              <strong>Productor:</strong> Puede subir y gestionar VODs. <br />
              <strong>Streamer:</strong> Puede crear y gestionar streams.
            </p>
          </CardContent>
        </Card>

        {/* List of collaborators */}
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores Actuales</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando...
              </div>
            ) : userRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay colaboradores asignados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole) => {
                    const roleInfo = roleLabels[userRole.role];
                    const RoleIcon = roleInfo?.icon || Shield;
                    
                    return (
                      <TableRow key={userRole.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {userRole.profile?.avatar_url ? (
                                <img
                                  src={userRole.profile.avatar_url}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <Users className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {userRole.profile?.full_name || userRole.profile?.username || 'Usuario'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{userRole.profile?.username || 'sin-username'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${roleInfo?.color || 'bg-slate-500'} text-white`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleInfo?.label || userRole.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {userRole.user_id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Remover rol?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción removerá el rol de {roleInfo?.label || userRole.role} de este usuario.
                                  El usuario perderá acceso a las funciones asociadas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveRole(userRole.id, userRole.role)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Administrators;

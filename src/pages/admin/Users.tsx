import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, Trash2, Shield, User, Search, X, CalendarIcon, Download, FileText, MessageSquare, Video, ArrowUpDown, UserCog, Ban, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  profile_type: string;
  email: string;
  ciudad: string;
  pais: string;
  created_at: string;
  provincia?: string;
  updated_at?: string;
}

interface UserStats {
  content_count: number;
  forum_posts_count: number;
  forum_threads_count: number;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string | null;
}

interface UserSanction {
  id: string;
  user_id: string;
  sanction_type: string;
  reason: string;
  duration_days: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  sanctioned_by: string;
  created_at: string;
}

const sanctionSchema = z.object({
  sanctionType: z.enum(['warning', 'temporary_ban', 'permanent_ban'], {
    required_error: "Debe seleccionar un tipo de sanción",
  }),
  reason: z.string()
    .trim()
    .min(10, { message: "La razón debe tener al menos 10 caracteres" })
    .max(500, { message: "La razón no puede exceder 500 caracteres" }),
  duration: z.number()
    .min(1, { message: "La duración debe ser al menos 1 día" })
    .max(365, { message: "La duración no puede exceder 365 días" })
    .optional(),
});

export default function AdminUsers() {
  const { user, loading: authLoading, isAdmin } = useAuth(true);
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [countries, setCountries] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [userStats, setUserStats] = useState<Map<string, UserStats>>(new Map());
  const [sortBy, setSortBy] = useState<string>("recent");
  const [userRoles, setUserRoles] = useState<Map<string, UserRole>>(new Map());
  const [userSanctions, setUserSanctions] = useState<Map<string, UserSanction[]>>(new Map());
  const [sanctionDialogOpen, setSanctionDialogOpen] = useState(false);
  const [selectedUserForSanction, setSelectedUserForSanction] = useState<UserProfile | null>(null);
  const [sanctionType, setSanctionType] = useState<string>("");
  const [sanctionReason, setSanctionReason] = useState("");
  const [sanctionDuration, setSanctionDuration] = useState<number>(7);
  const [sanctionErrors, setSanctionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadUsers();
    }
  }, [authLoading, user, isAdmin, searchQuery, profileTypeFilter, countryFilter, dateRange]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profile_details')
        .select('*');

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      // Apply profile type filter
      if (profileTypeFilter !== "all") {
        query = query.eq('profile_type', profileTypeFilter as any);
      }

      // Apply country filter
      if (countryFilter !== "all") {
        query = query.eq('pais', countryFilter);
      }

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        // Add one day to include the entire end date
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);

      // Extract unique countries for filter dropdown
      if (data) {
        const uniqueCountries = [...new Set(data.map(u => u.pais))].filter(Boolean).sort();
        setCountries(uniqueCountries as string[]);
        
        // Load stats, roles and sanctions for all users
        await Promise.all([
          loadUserStats(data.map(u => u.user_id)),
          loadUserRoles(data.map(u => u.user_id)),
          loadUserSanctions(data.map(u => u.user_id))
        ]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      // Get content uploads count
      const { data: contentData } = await supabase
        .from('content_uploads')
        .select('uploader_id')
        .in('uploader_id', userIds);

      // Get forum posts count
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('author_id')
        .in('author_id', userIds);

      // Get forum threads count
      const { data: threadsData } = await supabase
        .from('forum_threads')
        .select('author_id')
        .in('author_id', userIds);

      // Aggregate stats
      const statsMap = new Map<string, UserStats>();
      
      userIds.forEach(userId => {
        statsMap.set(userId, {
          content_count: contentData?.filter(c => c.uploader_id === userId).length || 0,
          forum_posts_count: postsData?.filter(p => p.author_id === userId).length || 0,
          forum_threads_count: threadsData?.filter(t => t.author_id === userId).length || 0,
        });
      });

      setUserStats(statsMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;

      const rolesMap = new Map<string, UserRole>();
      rolesData?.forEach(role => {
        rolesMap.set(role.user_id, role);
      });

      setUserRoles(rolesMap);
    } catch (error: any) {
      console.error('Error loading user roles:', error);
    }
  };

  const loadUserSanctions = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const { data: sanctionsData, error } = await supabase
        .from('forum_sanctions')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sanctionsMap = new Map<string, UserSanction[]>();
      sanctionsData?.forEach(sanction => {
        const existing = sanctionsMap.get(sanction.user_id) || [];
        sanctionsMap.set(sanction.user_id, [...existing, sanction]);
      });

      setUserSanctions(sanctionsMap);
    } catch (error: any) {
      console.error('Error loading user sanctions:', error);
    }
  };

  const handleAddSanction = async () => {
    // Reset errors
    setSanctionErrors({});

    // Validate input
    try {
      const validationData = {
        sanctionType,
        reason: sanctionReason,
        duration: sanctionType === 'temporary_ban' ? sanctionDuration : undefined,
      };

      sanctionSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setSanctionErrors(errors);
        return;
      }
    }

    if (!selectedUserForSanction || !sanctionType || !sanctionReason.trim()) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDate = new Date();
      let endDate = null;
      let durationDays = null;

      if (sanctionType === 'temporary_ban') {
        durationDays = sanctionDuration;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
      }

      const { error } = await supabase
        .from('forum_sanctions')
        .insert({
          user_id: selectedUserForSanction.user_id,
          sanction_type: sanctionType as any,
          reason: sanctionReason.trim(),
          duration_days: durationDays,
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString() || null,
          is_active: true,
          sanctioned_by: user?.id,
        } as any);

      if (error) throw error;

      // Log the action
      await logAction({
        action: 'update_user_role',
        targetType: 'user',
        targetId: selectedUserForSanction.user_id,
        details: {
          display_name: selectedUserForSanction.display_name,
          email: selectedUserForSanction.email,
          sanction_type: sanctionType,
          reason: sanctionReason,
          duration_days: durationDays,
        },
      });

      toast({
        title: "Sanción aplicada",
        description: `Se ha aplicado la sanción al usuario ${selectedUserForSanction.display_name}`,
      });

      // Reset form and reload
      setSanctionDialogOpen(false);
      setSelectedUserForSanction(null);
      setSanctionType("");
      setSanctionReason("");
      setSanctionDuration(7);
      setSanctionErrors({});
      await loadUserSanctions(users.map(u => u.user_id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aplicar la sanción",
        variant: "destructive",
      });
    }
  };

  const handleRevokeSanction = async (sanctionId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('forum_sanctions')
        .update({ is_active: false })
        .eq('id', sanctionId);

      if (error) throw error;

      toast({
        title: "Sanción revocada",
        description: "La sanción ha sido revocada exitosamente",
      });

      await loadUserSanctions(users.map(u => u.user_id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo revocar la sanción",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const currentRole = userRoles.get(userId);

      if (currentRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ 
            role: newRole as any,
            assigned_by: user?.id 
          })
          .eq('id', currentRole.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole as any,
            assigned_by: user?.id
          } as any);

        if (error) throw error;
      }

      // Log the action
      const userProfile = users.find(u => u.user_id === userId);
      await logAction({
        action: 'update_user_role',
        targetType: 'user',
        targetId: userId,
        details: {
          display_name: userProfile?.display_name,
          email: userProfile?.email,
          previous_role: currentRole?.role || 'user',
          new_role: newRole,
        },
      });

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido cambiado a ${newRole}`,
      });

      // Reload roles
      await loadUserRoles(users.map(u => u.user_id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Eliminar el perfil
      const { error: profileError } = await supabase
        .from('profile_details')
        .delete()
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Registrar en el log de auditoría
      await logAction({
        action: 'delete_user',
        targetType: 'user',
        targetId: selectedUser.user_id,
        details: {
          display_name: selectedUser.display_name,
          email: selectedUser.email,
          profile_type: selectedUser.profile_type,
        },
      });
      
      toast({
        title: "Usuario eliminado",
        description: "El perfil del usuario ha sido eliminado exitosamente",
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (usersToExport?: UserProfile[]) => {
    const dataToExport = usersToExport || users;
    
    if (dataToExport.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay usuarios para exportar",
        variant: "destructive",
      });
      return;
    }

    // Define CSV headers
    const headers = [
      "Nombre",
      "Email",
      "Tipo de Perfil",
      "País",
      "Ciudad",
      "Provincia",
      "Fecha de Registro",
    ];

    // Convert users to CSV rows
    const rows = dataToExport.map(user => [
      user.display_name,
      user.email || "",
      user.profile_type.replace(/_/g, ' '),
      user.pais,
      user.ciudad,
      user.provincia || "",
      format(new Date(user.created_at), "dd/MM/yyyy HH:mm", { locale: es }),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => `"${cell}"`).join(",")
      )
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // Generate filename with current date and active filters
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
    let filename = `usuarios_${timestamp}`;
    
    if (usersToExport) {
      filename += "_seleccionados";
    }
    if (profileTypeFilter !== "all") {
      filename += `_${profileTypeFilter}`;
    }
    if (countryFilter !== "all") {
      filename += `_${countryFilter}`;
    }
    if (dateRange?.from) {
      filename += `_desde_${format(dateRange.from, "yyyy-MM-dd")}`;
    }
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${dataToExport.length} usuario${dataToExport.length !== 1 ? 's' : ''} a CSV`,
    });
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const exportSelectedUsers = () => {
    const selectedUserData = users.filter(u => selectedUsers.has(u.id));
    exportToCSV(selectedUserData);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    try {
      const selectedUserIds = Array.from(selectedUsers);
      const usersToDelete = users.filter(u => selectedUsers.has(u.id));

      // Delete profiles
      const { error: profileError } = await supabase
        .from('profile_details')
        .delete()
        .in('id', selectedUserIds);

      if (profileError) throw profileError;

      // Log each deletion
      for (const user of usersToDelete) {
        await logAction({
          action: 'delete_user',
          targetType: 'user',
          targetId: user.user_id,
          details: {
            display_name: user.display_name,
            email: user.email,
            profile_type: user.profile_type,
            bulk_operation: true,
          },
        });
      }
      
      toast({
        title: "Usuarios eliminados",
        description: `Se eliminaron ${selectedUsers.size} usuario${selectedUsers.size !== 1 ? 's' : ''} exitosamente`,
      });

      setBulkDeleteDialogOpen(false);
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los usuarios",
        variant: "destructive",
      });
    }
  };

  const getSortedUsers = () => {
    const usersArray = [...users];
    
    switch (sortBy) {
      case "most_active":
        return usersArray.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      
      case "most_content":
        return usersArray.sort((a, b) => {
          const countA = userStats.get(a.user_id)?.content_count || 0;
          const countB = userStats.get(b.user_id)?.content_count || 0;
          return countB - countA;
        });
      
      case "most_forum":
        return usersArray.sort((a, b) => {
          const statsA = userStats.get(a.user_id);
          const statsB = userStats.get(b.user_id);
          const forumCountA = (statsA?.forum_posts_count || 0) + (statsA?.forum_threads_count || 0);
          const forumCountB = (statsB?.forum_posts_count || 0) + (statsB?.forum_threads_count || 0);
          return forumCountB - forumCountA;
        });
      
      case "recent":
      default:
        return usersArray.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }
  };

  const sortedUsers = getSortedUsers();

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">
              Administra los usuarios registrados en la plataforma
            </p>
          </div>
        <Button
          onClick={() => exportToCSV()}
          variant="outline"
          className="gap-2"
          disabled={users.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
              </div>

              {/* Filters Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Profile Type Filter */}
                    <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los perfiles</SelectItem>
                        <SelectItem value="band">Banda</SelectItem>
                        <SelectItem value="music_lover">Amante de la Música</SelectItem>
                        <SelectItem value="producer">Productor</SelectItem>
                        <SelectItem value="promoter">Promotor</SelectItem>
                        <SelectItem value="recording_studio">Estudio de Grabación</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Country Filter */}
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="País" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los países</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Date Range Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                                {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                              </>
                            ) : (
                              format(dateRange.from, "dd MMM yyyy", { locale: es })
                            )
                          ) : (
                            <span>Fecha de registro</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          locale={es}
                          className={cn("p-3 pointer-events-auto")}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Active Filters Summary */}
                  {(searchQuery || profileTypeFilter !== "all" || countryFilter !== "all" || dateRange) && (
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <span className="text-sm text-muted-foreground">Filtros activos:</span>
                      {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                          Búsqueda: {searchQuery}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setSearchQuery("")}
                          />
                        </Badge>
                      )}
                      {profileTypeFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          Tipo: {profileTypeFilter.replace('_', ' ')}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setProfileTypeFilter("all")}
                          />
                        </Badge>
                      )}
                      {countryFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          País: {countryFilter}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setCountryFilter("all")}
                          />
                        </Badge>
                      )}
                      {dateRange && (
                        <Badge variant="secondary" className="gap-1">
                          Fecha: {dateRange.from && format(dateRange.from, "dd/MM/yy", { locale: es })}
                          {dateRange.to && ` - ${format(dateRange.to, "dd/MM/yy", { locale: es })}`}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDateRange(undefined)}
                          />
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setProfileTypeFilter("all");
                          setCountryFilter("all");
                          setDateRange(undefined);
                        }}
                      >
                        Limpiar todos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bulk Actions Bar */}
              {selectedUsers.size > 0 && (
                <Card className="border-primary">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {selectedUsers.size} usuario{selectedUsers.size !== 1 ? 's' : ''} seleccionado{selectedUsers.size !== 1 ? 's' : ''}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUsers(new Set())}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar selección
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={exportSelectedUsers}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Exportar seleccionados
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setBulkDeleteDialogOpen(true)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar seleccionados
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results Count and Select All */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {users.length} usuario{users.length !== 1 ? 's' : ''}
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[220px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Más recientes</SelectItem>
                      <SelectItem value="most_active">Más activos</SelectItem>
                      <SelectItem value="most_content">Más contenido</SelectItem>
                      <SelectItem value="most_forum">Más participación foro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {users.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Seleccionar todos
                    </label>
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                {sortedUsers.map((userProfile) => (
                  <Card key={userProfile.id} className={selectedUsers.has(userProfile.id) ? "border-primary" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedUsers.has(userProfile.id)}
                          onCheckedChange={() => toggleUserSelection(userProfile.id)}
                        />
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {userProfile.display_name}
                        </CardTitle>
                      </div>
                      <Badge variant="outline">
                        {userProfile.profile_type.replace('_', ' ')}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{userProfile.email}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ubicación:</span>
                          <p className="font-medium">{userProfile.ciudad}, {userProfile.pais}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Registrado:</span>
                          <p className="font-medium">
                            {format(new Date(userProfile.created_at), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>

                      {/* Activity Statistics */}
                      {userStats.has(userProfile.user_id) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Contenido</p>
                              <p className="text-sm font-semibold">
                                {userStats.get(userProfile.user_id)?.content_count || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Hilos creados</p>
                              <p className="text-sm font-semibold">
                                {userStats.get(userProfile.user_id)?.forum_threads_count || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Posts foro</p>
                              <p className="text-sm font-semibold">
                                {userStats.get(userProfile.user_id)?.forum_posts_count || 0}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Última actividad</p>
                              <p className="text-sm font-semibold">
                                {userProfile.updated_at 
                                  ? format(new Date(userProfile.updated_at), "dd/MM/yyyy", { locale: es })
                                  : "N/A"
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Role Assignment */}
                      <div className="mb-4 p-3 border rounded-lg bg-card">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Rol del usuario:</span>
                          </div>
                          <Select 
                            value={userRoles.get(userProfile.user_id)?.role || 'user'}
                            onValueChange={(value) => 
                              handleRoleChange(userProfile.user_id, value)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Usuario
                                </div>
                              </SelectItem>
                              <SelectItem value="moderator">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Moderador
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-primary" />
                                  Administrador
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {userRoles.get(userProfile.user_id)?.assigned_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Asignado: {format(new Date(userRoles.get(userProfile.user_id)!.assigned_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </p>
                      )}
                      </div>

                      {/* Sanctions Display */}
                      {userSanctions.get(userProfile.user_id)?.some(s => s.is_active) && (
                        <div className="mb-4 p-3 border border-destructive/50 rounded-lg bg-destructive/5">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-semibold text-destructive">Sanciones Activas</span>
                          </div>
                          {userSanctions.get(userProfile.user_id)
                            ?.filter(s => s.is_active)
                            .map(sanction => (
                              <div key={sanction.id} className="mb-2 last:mb-0 p-2 bg-background rounded border">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <Badge variant="destructive" className="mb-1">
                                      {sanction.sanction_type === 'warning' && 'Advertencia'}
                                      {sanction.sanction_type === 'temporary_ban' && 'Suspensión Temporal'}
                                      {sanction.sanction_type === 'permanent_ban' && 'Suspensión Permanente'}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">{sanction.reason}</p>
                                    {sanction.end_date && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Expira: {format(new Date(sanction.end_date), "dd/MM/yyyy HH:mm", { locale: es })}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeSanction(sanction.id, userProfile.user_id)}
                                  >
                                    Revocar
                                  </Button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForSanction(userProfile);
                            setSanctionDialogOpen(true);
                          }}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Sancionar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userProfile);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No hay usuarios registrados
                </div>
              )}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el perfil de {selectedUser?.display_name}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedUsers.size} usuario{selectedUsers.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {selectedUsers.size} perfil{selectedUsers.size !== 1 ? 'es' : ''} de usuario.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Eliminar {selectedUsers.size} usuario{selectedUsers.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={sanctionDialogOpen} onOpenChange={setSanctionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar Sanción</DialogTitle>
            <DialogDescription>
              Aplica una sanción a {selectedUserForSanction?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Sanción</label>
              <Select value={sanctionType} onValueChange={setSanctionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de sanción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Advertencia
                    </div>
                  </SelectItem>
                  <SelectItem value="temporary_ban">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-orange-500" />
                      Suspensión Temporal
                    </div>
                  </SelectItem>
                  <SelectItem value="permanent_ban">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      Suspensión Permanente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {sanctionErrors.sanctionType && (
                <p className="text-xs text-destructive">{sanctionErrors.sanctionType}</p>
              )}
            </div>

            {sanctionType === 'temporary_ban' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Duración (días)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={sanctionDuration}
                  onChange={(e) => setSanctionDuration(parseInt(e.target.value) || 1)}
                />
                {sanctionErrors.duration && (
                  <p className="text-xs text-destructive">{sanctionErrors.duration}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Expira: {format(new Date(Date.now() + sanctionDuration * 24 * 60 * 60 * 1000), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Razón de la Sanción</label>
              <Textarea
                placeholder="Explique la razón de la sanción (mínimo 10 caracteres)..."
                value={sanctionReason}
                onChange={(e) => setSanctionReason(e.target.value)}
                rows={4}
                maxLength={500}
                className={sanctionErrors.reason ? "border-destructive" : ""}
              />
              {sanctionErrors.reason && (
                <p className="text-xs text-destructive">{sanctionErrors.reason}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {sanctionReason.length}/500 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSanctionDialogOpen(false);
              setSelectedUserForSanction(null);
              setSanctionType("");
              setSanctionReason("");
              setSanctionDuration(7);
              setSanctionErrors({});
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddSanction} variant="destructive">
              Aplicar Sanción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </AdminLayout>
  );
}

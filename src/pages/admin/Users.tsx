import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader2, Trash2, Shield, User, Search, X, CalendarIcon, Download } from "lucide-react";
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
}

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
                <div className="text-sm text-muted-foreground">
                  Mostrando {users.length} usuario{users.length !== 1 ? 's' : ''}
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
                {users.map((userProfile) => (
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                            {new Date(userProfile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
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
          </main>
        </div>
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
    </SidebarProvider>
  );
}

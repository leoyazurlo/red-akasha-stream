import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader2, Trash2, Shield, User, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadUsers();
    }
  }, [authLoading, user, isAdmin, searchQuery, profileTypeFilter, countryFilter]);

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
                <h2 className="text-3xl font-bold mb-2">Gestión de Usuarios</h2>
                <p className="text-muted-foreground">
                  Administra los usuarios registrados en la plataforma
                </p>
              </div>

              {/* Filters Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>

                  {/* Active Filters Summary */}
                  {(searchQuery || profileTypeFilter !== "all" || countryFilter !== "all") && (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setProfileTypeFilter("all");
                          setCountryFilter("all");
                        }}
                      >
                        Limpiar todos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Count */}
              <div className="text-sm text-muted-foreground">
                Mostrando {users.length} usuario{users.length !== 1 ? 's' : ''}
              </div>

              <div className="grid gap-4">
                {users.map((userProfile) => (
                  <Card key={userProfile.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {userProfile.display_name}
                      </CardTitle>
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
    </SidebarProvider>
  );
}

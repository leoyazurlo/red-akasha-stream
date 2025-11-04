import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Radio, Film, Headphones, Calendar, Eye, Users } from "lucide-react";

export default function Admin() {
  const { user, loading, isAdmin } = useAuth(true);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/foro" replace />;
  }

  const stats = [
    { title: 'Streams Activos', value: '3', icon: Radio, color: 'text-red-500' },
    { title: 'Videos (VOD)', value: '24', icon: Film, color: 'text-blue-500' },
    { title: 'Podcasts', value: '12', icon: Headphones, color: 'text-purple-500' },
    { title: 'Eventos Programados', value: '8', icon: Calendar, color: 'text-green-500' },
    { title: 'Total Espectadores', value: '1,234', icon: Eye, color: 'text-orange-500' },
    { title: 'Usuarios Registrados', value: '567', icon: Users, color: 'text-cyan-500' },
  ];

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
                <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
                <p className="text-muted-foreground">
                  Resumen general de la plataforma
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/admin/streams')}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Radio className="h-4 w-4" />
                          Gestionar Streams
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/admin/vod')}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Film className="h-4 w-4" />
                          Gestionar Videos
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/admin/podcasts')}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Headphones className="h-4 w-4" />
                          Gestionar Podcasts
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

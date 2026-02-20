import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import { PlatformActivityStats } from "@/components/admin/PlatformActivityStats";

export default function Admin() {
  const { user, loading, isAdmin } = useAuth(true);

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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Estadísticas y métricas de la plataforma
          </p>
        </div>

        {/* Platform Activity Stats - Datos de Movimientos */}
        <PlatformActivityStats />
      </div>
    </AdminLayout>
  );
}

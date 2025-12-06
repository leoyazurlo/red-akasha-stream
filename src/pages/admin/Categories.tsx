import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { Loader2 } from "lucide-react";

export default function AdminCategories() {
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
      <div className="max-w-6xl mx-auto">
        <CategoriesManager />
      </div>
    </AdminLayout>
  );
}

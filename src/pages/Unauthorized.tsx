import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="text-muted-foreground">
            No tenés permiso para acceder a esta sección. Si creés que esto es un error, contactá al
            administrador.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2 w-full sm:w-auto">
            <Home className="h-4 w-4" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

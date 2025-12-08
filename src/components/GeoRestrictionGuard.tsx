import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCountryDetection } from "@/hooks/useCountryDetection";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface GeoRestrictionGuardProps {
  children: React.ReactNode;
}

// Rutas permitidas para usuarios fuera de Latinoamérica sin suscripción
const ALLOWED_ROUTES = ["/", "/suscripciones", "/auth"];

export const GeoRestrictionGuard = ({ children }: GeoRestrictionGuardProps) => {
  const { country, isLoading: countryLoading } = useCountryDetection();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setCheckingSubscription(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setHasSubscription(!!data);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  useEffect(() => {
    // Si todavía está cargando, no hacer nada
    if (countryLoading || checkingSubscription) return;

    // Si es de Latinoamérica, permitir acceso
    if (country.isLatinAmerican) return;

    // Si tiene suscripción activa, permitir acceso
    if (hasSubscription) return;

    // Verificar si la ruta actual está permitida
    const isAllowedRoute = ALLOWED_ROUTES.some(route => 
      location.pathname === route || location.pathname.startsWith(route + "/")
    );

    // Si no es ruta permitida, redirigir a suscripciones
    if (!isAllowedRoute) {
      navigate("/suscripciones", { replace: true });
    }
  }, [country, countryLoading, hasSubscription, checkingSubscription, location.pathname, navigate]);

  // Mostrar loading mientras verifica
  if (countryLoading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ForumCategories } from "@/components/forum/ForumCategories";
import { ForumStats } from "@/components/forum/ForumStats";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Forum = () => {
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasProfile(false);
      } else {
        setHasProfile(true);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Asociación Requerida</CardTitle>
                  <CardDescription>
                    Para participar en el foro, primero debes asociarte a la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No tienes un perfil creado</AlertTitle>
                    <AlertDescription>
                      Para poder participar en el foro y colaborar con la comunidad, necesitas completar el proceso de asociación y crear tu perfil primero.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-6 flex gap-4">
                    <Button onClick={() => navigate("/asociate")} className="flex-1">
                      Asociarme Ahora
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                      Volver al Inicio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />
      
      <main className="relative z-10 pt-24">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
            <h1 className="text-4xl md:text-5xl font-poppins font-medium tracking-wide text-foreground text-center relative animate-slide-in">
              Foro Red Akasha
            </h1>
            <p className="text-muted-foreground text-center mt-4 text-lg">
              Espacio de debate y colaboración para la comunidad y el desarrollo de la plataforma como herramienta para músicos, productores, esperamos tu aporte
            </p>
          </div>

          {/* Stats Section */}
          <ForumStats />

          {/* Categories Section */}
          <ForumCategories />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Forum;

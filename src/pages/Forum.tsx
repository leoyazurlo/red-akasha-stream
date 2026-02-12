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
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { useTranslation } from "react-i18next";

const Forum = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const { elementRef: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.2 });

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
          <main id="main-content" className="pt-24 pb-16">
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
          
          <main id="main-content" className="pt-20 sm:pt-24 pb-12 sm:pb-16">
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto border-border bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl sm:text-2xl">{t('forum.associationRequired')}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {t('forum.associationRequiredDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm sm:text-base">{t('forum.noProfile')}</AlertTitle>
                    <AlertDescription className="text-xs sm:text-sm">
                      {t('forum.noProfileDesc')}
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <Button onClick={() => navigate("/asociate")} className="flex-1 h-11">
                      {t('forum.joinNow')}
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="flex-1 h-11">
                      {t('forum.backToHome')}
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
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />
      
      <CosmicBackground />
      <Header />
      
      <main id="main-content" className="container mx-auto px-4 py-6 pt-20 md:pt-24 pb-12 md:pb-16">
        {/* Hero Section - Responsive text */}
        <section 
          ref={heroRef}
          className={`text-center mb-8 md:mb-12 px-2 transition-all duration-700 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 bg-gradient-primary bg-clip-text text-transparent">
            {t('forum.title')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('forum.subtitle')}
          </p>
        </section>

        {/* Stats Section */}
        <ForumStats />

        {/* Categories Section */}
        <ForumCategories />
      </main>

      <Footer />
    </div>
  );
};

export default Forum;

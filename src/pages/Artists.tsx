import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Mic, Film, FileVideo, Camera, Radio, Search, Loader2 } from "lucide-react";
import { useArtists, ArtistType } from "@/hooks/useArtists";
import { ArtistCard } from "@/components/artists/ArtistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { supabase } from "@/integrations/supabase/client";

const Artists = () => {
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
  const { t } = useTranslation();
  const [selectedGenre, setSelectedGenre] = useState<ArtistType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { elementRef: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.2 });
  const { elementRef: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  const genres: Array<{ id: ArtistType | "all"; labelKey: string; icon: any; color: string }> = [
    { 
      id: "all", 
      labelKey: "artists.all", 
      icon: Search, 
      color: "bg-primary/10 hover:bg-primary/20" 
    },
    { 
      id: "musico", 
      labelKey: "artists.musicians", 
      icon: Music, 
      color: "bg-purple-500/10 hover:bg-purple-500/20" 
    },
    { 
      id: "percusion", 
      labelKey: "artists.percussion", 
      icon: Music, 
      color: "bg-indigo-500/10 hover:bg-indigo-500/20" 
    },
    { 
      id: "agrupacion", 
      labelKey: "artists.groups", 
      icon: Mic, 
      color: "bg-blue-500/10 hover:bg-blue-500/20" 
    },
    { 
      id: "dj", 
      labelKey: "artists.djs", 
      icon: Radio, 
      color: "bg-green-500/10 hover:bg-green-500/20" 
    },
    { 
      id: "vj", 
      labelKey: "artists.vjs", 
      icon: Film, 
      color: "bg-orange-500/10 hover:bg-orange-500/20" 
    },
    { 
      id: "danza", 
      labelKey: "artists.dancers", 
      icon: Music, 
      color: "bg-pink-500/10 hover:bg-pink-500/20" 
    },
    { 
      id: "fotografia_digital", 
      labelKey: "artists.digitalPhotography", 
      icon: Camera, 
      color: "bg-cyan-500/10 hover:bg-cyan-500/20" 
    },
  ];

  const { data: artists = [], isLoading } = useArtists(selectedGenre === "all" ? undefined : selectedGenre);

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">{t('artists.joinRequired')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-6 flex gap-4">
                  <Button onClick={() => navigate("/asociate")} className="flex-1">
                    {t('artists.joinNow')}
                  </Button>
                  <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                    {t('common.goBack')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />
      
      <Header />
      
      <main className="container mx-auto px-4 py-6 pt-20 md:pt-24 pb-12 md:pb-16">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className={`text-center mb-8 md:mb-12 transition-all duration-700 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 bg-gradient-primary bg-clip-text text-transparent">
            {t('artists.title')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            {t('artists.subtitle')}
          </p>
        </section>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12 animate-scale-in px-2">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('artists.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg border-2 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Genre Filters */}
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-10 md:mb-16 px-2">
          {genres.map((genre, index) => {
            const Icon = genre.icon;
            const isSelected = selectedGenre === genre.id;
            
            return (
              <Button
                key={genre.id}
                variant={isSelected ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedGenre(genre.id)}
                className={`
                  group relative overflow-hidden transition-all duration-300
                  hover:scale-105 hover:shadow-elegant
                  text-xs sm:text-sm md:text-base
                  h-9 sm:h-10 md:h-11
                  px-3 sm:px-4 md:px-6
                  ${!isSelected && genre.color}
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:rotate-12" />
                <span className="whitespace-nowrap">{t(genre.labelKey)}</span>
                {isSelected && (
                  <span className="ml-1.5 md:ml-2 bg-background/30 px-1.5 md:px-2 py-0.5 rounded-full text-xs">
                    {filteredArtists.length}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Artists Grid */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2"
        >
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))
          ) : filteredArtists.length === 0 ? (
            <div className="col-span-full text-center py-12 md:py-16">
              <p className="text-muted-foreground text-base md:text-lg px-4">
                {t('artists.noResults')}
              </p>
            </div>
          ) : (
            filteredArtists.map((artist, index) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                genreLabel={t(genres.find(g => g.id === artist.artist_type)?.labelKey || 'artists.all')}
                index={index}
              />
            ))
          )}
        </div>

        {/* Call to Action */}
        <section className="mt-12 md:mt-20 text-center animate-fade-in px-2">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                {t('artists.areYouArtist')}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 px-2">
                {t('artists.joinCommunity')}
              </p>
              <Button 
                size="lg" 
                className="hover:scale-105 transition-transform w-full sm:w-auto"
              >
                {t('artists.joinNow')}
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Artists;
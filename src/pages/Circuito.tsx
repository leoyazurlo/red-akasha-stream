import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProfileTechnicalSheet } from "@/components/ProfileTechnicalSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CardDescription } from "@/components/ui/card";
import { ChevronDown, Mail, Phone, MapPin, Users, Instagram, Facebook, Linkedin, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const latinAmericanCountries = [
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Bolivia", flag: "🇧🇴", code: "BO" },
  { name: "Brasil", flag: "🇧🇷", code: "BR" },
  { name: "Chile", flag: "🇨🇱", code: "CL" },
  { name: "Colombia", flag: "🇨🇴", code: "CO" },
  { name: "Costa Rica", flag: "🇨🇷", code: "CR" },
  { name: "Cuba", flag: "🇨🇺", code: "CU" },
  { name: "Ecuador", flag: "🇪🇨", code: "EC" },
  { name: "El Salvador", flag: "🇸🇻", code: "SV" },
  { name: "Guatemala", flag: "🇬🇹", code: "GT" },
  { name: "Honduras", flag: "🇭🇳", code: "HN" },
  { name: "México", flag: "🇲🇽", code: "MX" },
  { name: "Nicaragua", flag: "🇳🇮", code: "NI" },
  { name: "Panamá", flag: "🇵🇦", code: "PA" },
  { name: "Paraguay", flag: "🇵🇾", code: "PY" },
  { name: "Perú", flag: "🇵🇪", code: "PE" },
  { name: "República Dominicana", flag: "🇩🇴", code: "DO" },
  { name: "Uruguay", flag: "🇺🇾", code: "UY" },
  { name: "Venezuela", flag: "🇻🇪", code: "VE" },
];

interface ProfileDetail {
  id: string;
  display_name: string;
  avatar_url: string | null;
  profile_type: string;
  pais: string;
  ciudad: string;
  provincia: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  venue_type: string | null;
  capacity: number | null;
  genre: string | null;
  technical_specs: any;
}

interface LocationGroup {
  provincia: string;
  cities: CityGroup[];
}

interface CityGroup {
  ciudad: string;
  profiles: ProfileDetail[];
}

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "Agrupación Musical",
  sala_concierto: "Sala de Concierto",
  estudio_grabacion: "Estudio de Grabación",
  productor_artistico: "Productor Artístico",
  promotor_artistico: "Promotor Artístico",
  productor_audiovisual: "Productor Audiovisual"
};

const Circuito = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(latinAmericanCountries[0]);
  const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetail | null>(null);

  useEffect(() => {
    checkUserProfile();
  }, []);

  useEffect(() => {
    if (hasProfile) {
      fetchProfiles();
    }
  }, [selectedCountry, hasProfile]);

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

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_details')
        .select('*')
        .eq('pais', selectedCountry.name)
        .neq('profile_type', 'productor_audiovisual')
        .order('provincia', { ascending: true })
        .order('ciudad', { ascending: true });

      if (error) throw error;

      setAllProfiles(data || []);

      // Agrupar por provincia y ciudad
      const grouped = (data || []).reduce((acc: LocationGroup[], curr: ProfileDetail) => {
        const provincia = curr.provincia || 'Sin provincia';
        let provinciaGroup = acc.find(g => g.provincia === provincia);
        
        if (!provinciaGroup) {
          provinciaGroup = { provincia, cities: [] };
          acc.push(provinciaGroup);
        }

        let cityGroup = provinciaGroup.cities.find(c => c.ciudad === curr.ciudad);
        if (!cityGroup) {
          cityGroup = { ciudad: curr.ciudad, profiles: [] };
          provinciaGroup.cities.push(cityGroup);
        }

        cityGroup.profiles.push(curr);
        return acc;
      }, []);

      setLocationGroups(grouped);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
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
                  <CardTitle className="text-2xl">Para ver la base de datos deberías asociarte.</CardTitle>
                </CardHeader>
                <CardContent>
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
    <div className="min-h-screen bg-background relative">
      <CosmicBackground />
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <section className="text-center mb-16">
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                En esta sección podrás acceder a la base de datos y conocimiento del circuito de producción de la industria
              </p>

              {/* Country Selector */}
              <div className="flex justify-center items-center gap-4">
                <span className="text-foreground">Selecciona tu país:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">{selectedCountry.flag}</span>
                        {selectedCountry.name}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] max-h-[400px] overflow-y-auto bg-card border-border">
                    {latinAmericanCountries.map((country) => (
                      <DropdownMenuItem
                        key={country.code}
                        onClick={() => setSelectedCountry(country)}
                        className="cursor-pointer hover:bg-secondary"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{country.flag}</span>
                          {country.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </section>

            {/* Content Section */}
            <section className="max-w-6xl mx-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Cargando perfiles...</p>
                </div>
              ) : locationGroups.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4 text-primary">
                    {selectedCountry.name} {selectedCountry.flag}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Aún no hay perfiles registrados en {selectedCountry.name}.
                  </p>
                  <div className="p-6 bg-secondary/30 rounded-lg border border-border inline-block">
                    <h3 className="text-xl font-semibold mb-2">¿Quieres ser el primero?</h3>
                    <p className="text-muted-foreground">
                      Únete a la Red Akasha y aparece en el circuito de tu país.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2 text-primary">
                    Perfiles - {selectedCountry.name} {selectedCountry.flag}
                  </h2>
                  <p className="text-muted-foreground">
                    Encuentra espacios culturales, salas de grabación, bandas, productores y más
                  </p>
                </div>

                  {locationGroups.map((locationGroup) => (
                    <div key={locationGroup.provincia} className="space-y-8">
                      <div className="border-b border-border pb-2">
                        <h3 className="text-2xl font-bold text-primary">{locationGroup.provincia}</h3>
                      </div>

                      {locationGroup.cities.map((cityGroup) => (
                        <div key={cityGroup.ciudad} className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary" />
                            <h4 className="text-xl font-bold text-foreground">{cityGroup.ciudad}</h4>
                            <Badge variant="secondary" className="ml-2">
                              {cityGroup.profiles.length} {cityGroup.profiles.length === 1 ? 'perfil' : 'perfiles'}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            {cityGroup.profiles.map((profile) => (
                              <Card 
                                key={profile.id} 
                                className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all cursor-pointer"
                                onClick={() => setSelectedProfile(profile)}
                              >
                                <CardHeader>
                                  <div className="flex items-start gap-4">
                                    <Avatar className="w-16 h-16 border-2 border-primary">
                                      <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                        {profile.display_name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-lg mb-1">{profile.display_name}</CardTitle>
                                      <Badge variant="outline" className="mb-2">
                                        {profileTypeLabels[profile.profile_type] || profile.profile_type}
                                      </Badge>
                                      {profile.venue_type && (
                                        <p className="text-sm text-muted-foreground capitalize">
                                          {profile.venue_type}
                                        </p>
                                      )}
                                      {profile.genre && (
                                        <p className="text-sm text-muted-foreground">
                                          Género: {profile.genre}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {profile.bio && (
                                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                                  )}

                                  {profile.capacity && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Users className="w-4 h-4 text-primary" />
                                      <span>Capacidad: {profile.capacity} personas</span>
                                    </div>
                                  )}

                                  {profile.technical_specs && (
                                    <div className="bg-secondary/20 p-3 rounded-md">
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">Ficha Técnica:</p>
                                      <p className="text-sm whitespace-pre-wrap">{JSON.stringify(profile.technical_specs, null, 2)}</p>
                                    </div>
                                  )}

                                  {/* Contact Info */}
                                  <div className="space-y-2 text-sm border-t border-border pt-3">
                                    {profile.email && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors truncate">
                                          {profile.email}
                                        </a>
                                      </div>
                                    )}
                                    {profile.telefono && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        <a href={`tel:${profile.telefono}`} className="hover:text-primary transition-colors">
                                          {profile.telefono}
                                        </a>
                                      </div>
                                    )}
                                    {profile.whatsapp && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                          WhatsApp: {profile.whatsapp}
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {/* Social Media */}
                                  {(profile.instagram || profile.facebook || profile.linkedin) && (
                                    <div className="flex gap-3 pt-2 border-t border-border">
                                      {profile.instagram && (
                                        <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                          <Instagram className="w-5 h-5" />
                                        </a>
                                      )}
                                      {profile.facebook && (
                                        <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                          <Facebook className="w-5 h-5" />
                                        </a>
                                      )}
                                      {profile.linkedin && (
                                        <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                          <Linkedin className="w-5 h-5" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        <Footer />

        {/* Profile Detail Dialog */}
        <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-y-auto bg-transparent border-none">
            {selectedProfile && (
              <ProfileTechnicalSheet
                profileId={selectedProfile.id}
                displayName={selectedProfile.display_name}
                profileType={selectedProfile.profile_type}
                bio={selectedProfile.bio}
                avatarUrl={selectedProfile.avatar_url}
                instagram={selectedProfile.instagram}
                facebook={selectedProfile.facebook}
                linkedin={selectedProfile.linkedin}
                whatsapp={selectedProfile.whatsapp}
                email={selectedProfile.email}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Circuito;

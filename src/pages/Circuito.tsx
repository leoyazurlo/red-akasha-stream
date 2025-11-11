import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ChevronDown, Mail, Phone, MapPin, Users, Instagram, Facebook, Linkedin, ExternalLink, Loader2, AlertCircle, Search, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Tipo para la vista pública sin información sensible
interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  profile_type: string;
  pais: string;
  ciudad: string;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  venue_type: string | null;
  capacity: number | null;
  genre: string | null;
  technical_specs: any;
  created_at: string;
  updated_at: string;
}

interface LocationGroup {
  provincia: string;
  cities: CityGroup[];
}

interface CityGroup {
  ciudad: string;
  profiles: PublicProfile[];
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
  const [locationGroups, setLocationGroups] = useState<CityGroup[]>([]);
  const [allProfiles, setAllProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");

  // Función para obtener el desglose de perfiles por tipo
  const getProfileTypeBreakdown = (profiles: PublicProfile[]) => {
    const typeCounts: Record<string, number> = {};
    
    profiles.forEach(profile => {
      const type = profile.profile_type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => {
        const label = profileTypeLabels[type] || type;
        return `${count} ${label}${count !== 1 ? 's' : ''}`;
      })
      .join(', ');
  };

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
        .from('public_profiles')
        .select('*')
        .eq('pais', selectedCountry.name)
        .order('ciudad', { ascending: true });

      if (error) throw error;

      setAllProfiles(data || []);

      // Agrupar solo por ciudad
      const grouped = (data || []).reduce((acc: CityGroup[], curr: PublicProfile) => {
        let cityGroup = acc.find(c => c.ciudad === curr.ciudad);
        if (!cityGroup) {
          cityGroup = { ciudad: curr.ciudad, profiles: [] };
          acc.push(cityGroup);
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

  // Función para ordenar perfiles
  const sortProfiles = (profiles: PublicProfile[]) => {
    const sorted = [...profiles];
    
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.display_name.localeCompare(b.display_name));
      case "name-desc":
        return sorted.sort((a, b) => b.display_name.localeCompare(a.display_name));
      case "date-newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      case "date-oldest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateA - dateB;
        });
      default:
        return sorted;
    }
  };

  // Filtrar y ordenar perfiles en tiempo real
  const filteredLocationGroups = locationGroups
    .map((cityGroup) => ({
      ...cityGroup,
      profiles: sortProfiles(
        cityGroup.profiles.filter((profile) => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return (
            profile.display_name.toLowerCase().includes(term) ||
            profile.ciudad.toLowerCase().includes(term)
          );
        })
      ),
    }))
    .filter((cityGroup) => cityGroup.profiles.length > 0);

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

            {/* Search Bar and Sort */}
            {!loading && allProfiles.length > 0 && (
              <section className="max-w-6xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre, ciudad o provincia..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-6 text-base bg-card/50 backdrop-blur-sm border-border"
                    />
                  </div>
                  <div className="sm:w-64">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="py-6 bg-card/50 backdrop-blur-sm border-border">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4" />
                          <SelectValue placeholder="Ordenar por..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                        <SelectItem value="date-newest">Más recientes</SelectItem>
                        <SelectItem value="date-oldest">Más antiguos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {/* Content Section */}
            <section className="max-w-6xl mx-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Cargando perfiles...</p>
                </div>
              ) : filteredLocationGroups.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4 text-primary">
                    No se encontraron resultados
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    No hay perfiles que coincidan con tu búsqueda "{searchTerm}".
                  </p>
                  <Button onClick={() => setSearchTerm("")} variant="outline">
                    Limpiar búsqueda
                  </Button>
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
                    {searchTerm
                      ? `Mostrando resultados para "${searchTerm}"`
                      : "Encuentra espacios culturales, salas de grabación, bandas, productores y más"}
                  </p>
                </div>

                  {filteredLocationGroups.map((cityGroup) => (
                    <div key={cityGroup.ciudad} className="space-y-4 mb-12">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          <h4 className="text-xl font-bold text-foreground">{cityGroup.ciudad}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground ml-7">
                          {getProfileTypeBreakdown(cityGroup.profiles)}
                        </p>
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
                                  <Badge variant="outline" className="mb-2 border-primary text-primary">
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
                whatsapp={null}
                email={null}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Circuito;

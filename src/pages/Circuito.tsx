import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Mail, Phone, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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

interface RegistrationRequest {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  ciudad: string;
  pais: string | null;
  provincia: string | null;
  areas_interes: string[] | null;
  que_buscas: string[] | null;
  perfil: string[] | null;
  motivacion: string;
  created_at: string;
}

interface CityGroup {
  ciudad: string;
  usuarios: RegistrationRequest[];
}

const Circuito = () => {
  const [selectedCountry, setSelectedCountry] = useState(latinAmericanCountries[0]);
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedCountry]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('status', 'approved')
        .eq('pais', selectedCountry.name)
        .order('ciudad', { ascending: true });

      if (error) throw error;

      // Agrupar por ciudad
      const grouped = (data || []).reduce((acc: CityGroup[], curr: RegistrationRequest) => {
        const cityGroup = acc.find(g => g.ciudad === curr.ciudad);
        if (cityGroup) {
          cityGroup.usuarios.push(curr);
        } else {
          acc.push({ ciudad: curr.ciudad, usuarios: [curr] });
        }
        return acc;
      }, []);

      setCityGroups(grouped);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      <Header />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Circuito Red Akasha
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Descubre eventos y actividades de Red Akasha en toda Latinoamérica
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
                <p className="text-muted-foreground mt-4">Cargando colaboradores...</p>
              </div>
            ) : cityGroups.length === 0 ? (
              <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-8 text-center">
                <h2 className="text-2xl font-bold mb-4 text-primary">
                  {selectedCountry.name} {selectedCountry.flag}
                </h2>
                <p className="text-muted-foreground mb-6">
                  Aún no hay colaboradores registrados en {selectedCountry.name}.
                </p>
                <div className="p-6 bg-secondary/30 rounded-lg border border-border inline-block">
                  <h3 className="text-xl font-semibold mb-2">¿Quieres ser el primero?</h3>
                  <p className="text-muted-foreground">
                    Únete a la Red Akasha y aparece en el circuito de tu país.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2 text-primary">
                    Colaboradores en {selectedCountry.name} {selectedCountry.flag}
                  </h2>
                  <p className="text-muted-foreground">
                    Encuentra espacios culturales, salas de grabación, músicos y más
                  </p>
                </div>

                {cityGroups.map((cityGroup) => (
                  <div key={cityGroup.ciudad} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="text-2xl font-bold text-foreground">{cityGroup.ciudad}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {cityGroup.usuarios.length} {cityGroup.usuarios.length === 1 ? 'colaborador' : 'colaboradores'}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {cityGroup.usuarios.map((usuario) => (
                        <Card key={usuario.id} className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all">
                          <CardHeader>
                            <CardTitle className="flex items-start justify-between">
                              <div>
                                <span className="block">{usuario.nombre}</span>
                                {usuario.provincia && (
                                  <span className="text-sm text-muted-foreground font-normal">
                                    {usuario.provincia}
                                  </span>
                                )}
                              </div>
                              {usuario.perfil && usuario.perfil.length > 0 && (
                                <Users className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {usuario.perfil && usuario.perfil.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {usuario.perfil.map((perfil, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {perfil}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {usuario.areas_interes && usuario.areas_interes.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Áreas:</p>
                                <div className="flex flex-wrap gap-1">
                                  {usuario.areas_interes.map((area, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${usuario.email}`} className="hover:text-primary transition-colors">
                                  {usuario.email}
                                </a>
                              </div>
                              {usuario.telefono && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="w-4 h-4" />
                                  <a href={`tel:${usuario.telefono}`} className="hover:text-primary transition-colors">
                                    {usuario.telefono}
                                  </a>
                                </div>
                              )}
                            </div>

                            {usuario.que_buscas && usuario.que_buscas.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Busca:</p>
                                <p className="text-sm text-muted-foreground">
                                  {usuario.que_buscas.join(', ')}
                                </p>
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
    </div>
  );
};

export default Circuito;

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

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

const Circuito = () => {
  const [selectedCountry, setSelectedCountry] = useState(latinAmericanCountries[0]);

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
          <section className="max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-8">
              <h2 className="text-3xl font-bold mb-4 text-primary">
                Eventos en {selectedCountry.name} {selectedCountry.flag}
              </h2>
              <p className="text-muted-foreground mb-6">
                Próximamente encontrarás aquí todos los eventos, talleres y actividades 
                de Red Akasha en {selectedCountry.name}.
              </p>
              
              <div className="grid gap-4 mt-8">
                <div className="p-6 bg-secondary/30 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold mb-2">¿Eres organizador?</h3>
                  <p className="text-muted-foreground">
                    Contacta con nosotros para incluir tus eventos en el circuito de Red Akasha.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Circuito;

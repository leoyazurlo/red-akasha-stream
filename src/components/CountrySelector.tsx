import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Country {
  code: string;
  name: string;
  flag: string;
}

export const latinAmericanCountries: Country[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
];

// Mapeo de nombres de países (como vienen de la BD) a códigos
export const countryNameToCode: Record<string, string> = {
  'argentina': 'AR',
  'bolivia': 'BO',
  'brasil': 'BR',
  'brazil': 'BR',
  'chile': 'CL',
  'colombia': 'CO',
  'costa rica': 'CR',
  'cuba': 'CU',
  'república dominicana': 'DO',
  'republica dominicana': 'DO',
  'dominican republic': 'DO',
  'ecuador': 'EC',
  'el salvador': 'SV',
  'guatemala': 'GT',
  'honduras': 'HN',
  'méxico': 'MX',
  'mexico': 'MX',
  'nicaragua': 'NI',
  'panamá': 'PA',
  'panama': 'PA',
  'paraguay': 'PY',
  'perú': 'PE',
  'peru': 'PE',
  'puerto rico': 'PR',
  'uruguay': 'UY',
  'venezuela': 'VE',
};

interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const CountrySelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Selecciona tu país",
  isLoading = false
}: CountrySelectorProps) => {
  const selectedCountry = latinAmericanCountries.find(c => c.code === value);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Selecciona tu país:
      </span>
      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Detectando ubicación...</span>
        </div>
      ) : (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-[220px] bg-card border-border">
            <SelectValue placeholder={placeholder}>
              {selectedCountry && (
                <span className="flex items-center gap-2">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span>{selectedCountry.name}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {latinAmericanCountries.map((country) => (
              <SelectItem 
                key={country.code} 
                value={country.code}
                className="cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

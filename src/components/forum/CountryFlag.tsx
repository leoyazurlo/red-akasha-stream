import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CountryFlagProps {
  userId: string;
  className?: string;
}

// Map country names to flag emoji codes
const countryToFlag: Record<string, string> = {
  // Latin America
  "argentina": "🇦🇷",
  "ar": "🇦🇷",
  "bolivia": "🇧🇴",
  "bo": "🇧🇴",
  "brasil": "🇧🇷",
  "brazil": "🇧🇷",
  "br": "🇧🇷",
  "chile": "🇨🇱",
  "cl": "🇨🇱",
  "colombia": "🇨🇴",
  "co": "🇨🇴",
  "costa rica": "🇨🇷",
  "cr": "🇨🇷",
  "cuba": "🇨🇺",
  "cu": "🇨🇺",
  "ecuador": "🇪🇨",
  "ec": "🇪🇨",
  "el salvador": "🇸🇻",
  "sv": "🇸🇻",
  "guatemala": "🇬🇹",
  "gt": "🇬🇹",
  "honduras": "🇭🇳",
  "hn": "🇭🇳",
  "méxico": "🇲🇽",
  "mexico": "🇲🇽",
  "mx": "🇲🇽",
  "nicaragua": "🇳🇮",
  "ni": "🇳🇮",
  "panamá": "🇵🇦",
  "panama": "🇵🇦",
  "pa": "🇵🇦",
  "paraguay": "🇵🇾",
  "py": "🇵🇾",
  "perú": "🇵🇪",
  "peru": "🇵🇪",
  "pe": "🇵🇪",
  "puerto rico": "🇵🇷",
  "pr": "🇵🇷",
  "república dominicana": "🇩🇴",
  "dominican republic": "🇩🇴",
  "do": "🇩🇴",
  "uruguay": "🇺🇾",
  "uy": "🇺🇾",
  "venezuela": "🇻🇪",
  "ve": "🇻🇪",
  // Europe
  "españa": "🇪🇸",
  "spain": "🇪🇸",
  "es": "🇪🇸",
  "francia": "🇫🇷",
  "france": "🇫🇷",
  "fr": "🇫🇷",
  "italia": "🇮🇹",
  "italy": "🇮🇹",
  "it": "🇮🇹",
  "alemania": "🇩🇪",
  "germany": "🇩🇪",
  "de": "🇩🇪",
  "portugal": "🇵🇹",
  "pt": "🇵🇹",
  "reino unido": "🇬🇧",
  "united kingdom": "🇬🇧",
  "uk": "🇬🇧",
  "gb": "🇬🇧",
  // North America
  "estados unidos": "🇺🇸",
  "united states": "🇺🇸",
  "usa": "🇺🇸",
  "us": "🇺🇸",
  "canadá": "🇨🇦",
  "canada": "🇨🇦",
  "ca": "🇨🇦",
  // Asia
  "japón": "🇯🇵",
  "japan": "🇯🇵",
  "jp": "🇯🇵",
  "china": "🇨🇳",
  "cn": "🇨🇳",
  "corea del sur": "🇰🇷",
  "south korea": "🇰🇷",
  "kr": "🇰🇷",
  // Oceania
  "australia": "🇦🇺",
  "au": "🇦🇺",
  "nueva zelanda": "🇳🇿",
  "new zealand": "🇳🇿",
  "nz": "🇳🇿",
  // Africa
  "sudáfrica": "🇿🇦",
  "south africa": "🇿🇦",
  "za": "🇿🇦",
};

const getCountryFlag = (country: string | null | undefined): string | null => {
  if (!country) return null;
  const normalizedCountry = country.toLowerCase().trim();
  return countryToFlag[normalizedCountry] || null;
};

export const CountryFlag = ({ userId, className = "" }: CountryFlagProps) => {
  const { data: country } = useQuery({
    queryKey: ["user-country", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_details")
        .select("pais")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data?.pais || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const flag = getCountryFlag(country);

  if (!flag) return null;

  return (
    <span 
      className={`inline-block ${className}`} 
      title={country || undefined}
      role="img"
      aria-label={`Bandera de ${country}`}
    >
      {flag}
    </span>
  );
};

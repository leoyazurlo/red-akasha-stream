import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeo de códigos de país a los códigos que usamos en el selector
const countryCodeMap: Record<string, string> = {
  'AR': 'AR', // Argentina
  'BO': 'BO', // Bolivia
  'BR': 'BR', // Brasil
  'CL': 'CL', // Chile
  'CO': 'CO', // Colombia
  'CR': 'CR', // Costa Rica
  'CU': 'CU', // Cuba
  'DO': 'DO', // República Dominicana
  'EC': 'EC', // Ecuador
  'SV': 'SV', // El Salvador
  'GT': 'GT', // Guatemala
  'HN': 'HN', // Honduras
  'MX': 'MX', // México
  'NI': 'NI', // Nicaragua
  'PA': 'PA', // Panamá
  'PY': 'PY', // Paraguay
  'PE': 'PE', // Perú
  'PR': 'PR', // Puerto Rico
  'UY': 'UY', // Uruguay
  'VE': 'VE', // Venezuela
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (Supabase edge functions provide this)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') ||
                     '8.8.8.8'; // Fallback for testing

    console.log('Detecting country for IP:', clientIP);

    // Use ip-api.com (free tier - no API key needed)
    const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,countryCode,country,city`);
    
    if (!response.ok) {
      console.error('IP API response not ok:', response.status);
      return new Response(
        JSON.stringify({ countryCode: 'AR', countryName: 'Argentina', detected: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('IP API response:', data);

    if (data.status === 'success') {
      const detectedCode = data.countryCode;
      const mappedCode = countryCodeMap[detectedCode];
      
      if (mappedCode) {
        console.log(`Detected Latin American country: ${data.country} (${mappedCode})`);
        return new Response(
          JSON.stringify({
            countryCode: mappedCode,
            countryName: data.country,
            city: data.city,
            detected: true,
            isLatinAmerican: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Not a Latin American country, default to Argentina
        console.log(`Non-Latin American country detected: ${data.country}, defaulting to AR`);
        return new Response(
          JSON.stringify({
            countryCode: 'AR',
            countryName: 'Argentina',
            originalCountry: data.country,
            originalCode: detectedCode,
            detected: true,
            isLatinAmerican: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback if detection fails
    console.log('IP detection failed, defaulting to AR');
    return new Response(
      JSON.stringify({ countryCode: 'AR', countryName: 'Argentina', detected: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting country:', error);
    return new Response(
      JSON.stringify({ 
        countryCode: 'AR', 
        countryName: 'Argentina', 
        detected: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

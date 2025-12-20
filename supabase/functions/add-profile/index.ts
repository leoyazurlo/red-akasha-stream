import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sanitizeString = (str: string, maxLength: number): string => {
  return str.trim().substring(0, maxLength);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado. Por favor inicia sesión.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a client with the user's token to verify they're logged in
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('No autorizado. Por favor inicia sesión.');
    }

    const requestData = await req.json();
    
    // Validate required fields
    if (!requestData.profile_type) {
      throw new Error('Tipo de perfil es requerido');
    }

    console.log(`Adding new profile for user ${user.id}, type: ${requestData.profile_type}`);

    // Prepare profile data with sanitization
    const profileData: any = {
      user_id: user.id,
      profile_type: requestData.profile_type,
      avatar_url: requestData.avatar_url || null,
      display_name: sanitizeString(requestData.display_name || requestData.nombre || '', 200),
      bio: requestData.bio ? sanitizeString(requestData.bio, 1000) : null,
      pais: sanitizeString(requestData.pais || '', 100),
      provincia: requestData.provincia ? sanitizeString(requestData.provincia, 100) : null,
      ciudad: sanitizeString(requestData.ciudad || '', 100),
      instagram: requestData.instagram ? sanitizeString(requestData.instagram, 500) : null,
      facebook: requestData.facebook ? sanitizeString(requestData.facebook, 500) : null,
      linkedin: requestData.linkedin ? sanitizeString(requestData.linkedin, 500) : null,
      email: user.email,
      telefono: requestData.telefono ? sanitizeString(requestData.telefono, 20) : null,
      whatsapp: requestData.whatsapp ? sanitizeString(requestData.whatsapp, 500) : null,
    };

    // Add profile-specific fields
    if (requestData.profile_type === "estudio_grabacion") {
      profileData.technical_specs = requestData.technical_specs ? 
        JSON.stringify({ description: sanitizeString(requestData.technical_specs, 2000) }) : null;
      profileData.map_location = requestData.map_location ? sanitizeString(requestData.map_location, 500) : null;
    } else if (requestData.profile_type === "sala_concierto") {
      profileData.venue_type = requestData.venue_type ? sanitizeString(requestData.venue_type, 100) : null;
      profileData.capacity = requestData.capacity ? parseInt(String(requestData.capacity)) : null;
    } else if (requestData.profile_type === "agrupacion_musical") {
      profileData.genre = requestData.genre ? sanitizeString(requestData.genre, 100) : null;
      profileData.formation_date = requestData.formation_date || null;
      profileData.producer_instagram = requestData.producer_instagram ? sanitizeString(requestData.producer_instagram, 500) : null;
      profileData.recorded_at = requestData.recorded_at ? sanitizeString(requestData.recorded_at, 200) : null;
    } else if (requestData.profile_type === "marketing_digital") {
      profileData.technical_specs = JSON.stringify({
        marketing_services: requestData.marketing_services || [],
        specialties: requestData.specialties ? sanitizeString(requestData.specialties, 1000) : null,
        portfolio_url: requestData.portfolio_url ? sanitizeString(requestData.portfolio_url, 500) : null
      });
    } else if (requestData.profile_type === "musico") {
      profileData.genre = requestData.genre ? sanitizeString(requestData.genre, 100) : null;
      profileData.technical_specs = JSON.stringify({
        instrument: requestData.instrument ? sanitizeString(requestData.instrument, 100) : null,
        experience_level: requestData.experience_level ? sanitizeString(requestData.experience_level, 100) : null,
        education: requestData.education ? sanitizeString(requestData.education, 500) : null,
        available_for: requestData.available_for ? sanitizeString(requestData.available_for, 500) : null
      });
    } else if (requestData.profile_type === "sello_discografico") {
      profileData.formation_date = requestData.formation_date || null;
      profileData.technical_specs = JSON.stringify({
        label_genres: requestData.label_genres || [],
        website: requestData.website ? sanitizeString(requestData.website, 500) : null,
        services: requestData.services ? sanitizeString(requestData.services, 1000) : null
      });
    }

    // Insert profile using admin client
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profile_details')
      .insert(profileData)
      .select('id')
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError);
      throw new Error('Error al crear el perfil: ' + profileError.message);
    }

    console.log(`Profile created successfully: ${newProfile.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Perfil agregado exitosamente',
        user_id: user.id,
        profile_id: newProfile.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Add profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar la solicitud';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sanitizeString = (str: string, maxLength: number): string => {
  if (!str) return '';
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
      throw new Error('No autorizado.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('No autorizado.');
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      throw new Error('No tienes permisos de administrador.');
    }

    const { requestId, password, avatar_url } = await req.json();
    
    if (!requestId) {
      throw new Error('ID de solicitud es requerido');
    }

    if (!password) {
      throw new Error('Contraseña es requerida para crear el usuario');
    }

    // Get the registration request
    const { data: request, error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Solicitud no encontrada');
    }

    if (request.status !== 'pending') {
      throw new Error('Esta solicitud ya fue procesada');
    }

    console.log(`Approving registration for: ${request.email}`);

    // Step 1: Create auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizeString(request.nombre, 200),
      }
    });

    if (signUpError) {
      const msg = signUpError.message ? String(signUpError.message).toLowerCase() : "";
      if (msg.includes("registered") || msg.includes("exists")) {
        throw new Error('Este email ya está registrado. El usuario puede iniciar sesión directamente.');
      }
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear la cuenta');
    }

    console.log(`Auth user created: ${authData.user.id}`);

    // Step 2: Create profile(s) for each selected profile type
    const profileTypes = request.perfil || ['amante_de_la_musica'];
    const createdProfiles: string[] = [];

    for (const profileType of profileTypes) {
      const profileData = {
        user_id: authData.user.id,
        profile_type: profileType,
        avatar_url: avatar_url || null,
        display_name: sanitizeString(request.nombre, 200),
        bio: sanitizeString(request.motivacion, 1000),
        pais: sanitizeString(request.pais || '', 100),
        provincia: request.provincia ? sanitizeString(request.provincia, 100) : null,
        ciudad: sanitizeString(request.ciudad || '', 100),
        email: request.email,
        telefono: request.telefono ? sanitizeString(request.telefono, 20) : null,
      };

      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profile_details')
        .insert(profileData)
        .select('id')
        .single();

      if (profileError) {
        console.error(`Error creating profile ${profileType}:`, profileError);
        // Continue with other profiles
      } else if (newProfile) {
        createdProfiles.push(newProfile.id);
        console.log(`Profile created: ${newProfile.id} (${profileType})`);
      }
    }

    // Step 3: Update registration request status
    const { error: updateError } = await supabaseAdmin
      .from('registration_requests')
      .update({
        status: 'approved',
        user_id: authData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
    }

    console.log(`Registration approved successfully for ${request.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario aprobado y creado exitosamente',
        user_id: authData.user.id,
        profile_ids: createdProfiles,
        email: request.email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Approve registration error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Server-side validation schemas
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 72;
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  return phone.length >= 10 && phone.length <= 20 && /^\+?[\d\s-()]+$/.test(phone);
};

const validateUrl = (url: string): boolean => {
  if (!url) return true; // Optional field
  const trimmed = String(url).trim();
  if (!trimmed) return true;
  if (trimmed.length > 500) return false;

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const validateInstagram = (value: string): boolean => {
  if (!value) return true;
  const v = String(value).trim();
  if (!v) return true;

  // Accept @handle or plain handle
  const handle = v.startsWith('@') ? v.slice(1) : v;
  if (/^[A-Za-z0-9._]{1,50}$/.test(handle)) return true;

  // Or accept an URL (with or without protocol)
  return validateUrl(v);
};

const validateWhatsApp = (value: string): boolean => {
  if (!value) return true;
  const v = String(value).trim();
  if (!v) return true;

  // If it looks like a link (wa.me / api.whatsapp / etc), validate as URL
  if (/[/.]/.test(v)) return validateUrl(v);

  // Otherwise validate as phone
  return validatePhone(v);
};

const sanitizeString = (str: string, maxLength: number): string => {
  return str.trim().substring(0, maxLength);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    
    // Validate required fields
    if (!requestData.profile_type) {
      throw new Error('Tipo de perfil es requerido');
    }

    if (!requestData.nombre || requestData.nombre.trim().length < 2) {
      throw new Error('Nombre debe tener al menos 2 caracteres');
    }

    if (!requestData.email || !validateEmail(requestData.email)) {
      throw new Error('Email inválido');
    }

    if (!requestData.password || !validatePassword(requestData.password)) {
      throw new Error('Contraseña debe tener entre 8 y 72 caracteres');
    }

    if (requestData.password !== requestData.confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    // Validate phone
    if (requestData.telefono && !validatePhone(requestData.telefono)) {
      throw new Error('Número de teléfono inválido');
    }

    if (requestData.whatsapp && !validateWhatsApp(requestData.whatsapp)) {
      throw new Error('WhatsApp inválido');
    }

    // Validate URLs (accepts with or without protocol)
    const urlFields = ['facebook', 'linkedin', 'website', 'portfolio_url'];
    for (const field of urlFields) {
      if (requestData[field] && !validateUrl(requestData[field])) {
        throw new Error(`URL inválida en campo ${field}`);
      }
    }

    // Validate Instagram handles/URLs
    const igFields = ['instagram', 'producer_instagram'];
    for (const field of igFields) {
      if (requestData[field] && !validateInstagram(requestData[field])) {
        throw new Error(`Instagram inválido en campo ${field}`);
      }
    }

    const email = sanitizeString(requestData.email, 255).toLowerCase();
    
    // Step 1: Create auth user with server-side validation
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizeString(requestData.nombre, 200),
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
        throw new Error('Este email ya está en uso. Por favor, inicia sesión o usa otro email.');
      }
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear la cuenta');
    }

    // Step 2: Prepare profile data with sanitization
    const profileData: any = {
      user_id: authData.user.id,
      profile_type: requestData.profile_type,
      avatar_url: requestData.avatar_url || null,
      display_name: sanitizeString(requestData.display_name || requestData.nombre, 200),
      bio: requestData.bio ? sanitizeString(requestData.bio, 1000) : null,
      pais: sanitizeString(requestData.pais || '', 100),
      provincia: requestData.provincia ? sanitizeString(requestData.provincia, 100) : null,
      ciudad: sanitizeString(requestData.ciudad || '', 100),
      instagram: requestData.instagram ? sanitizeString(requestData.instagram, 500) : null,
      facebook: requestData.facebook ? sanitizeString(requestData.facebook, 500) : null,
      linkedin: requestData.linkedin ? sanitizeString(requestData.linkedin, 500) : null,
      email,
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
      profileData.capacity = requestData.capacity ? parseInt(requestData.capacity) : null;
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

    // Step 3: Insert profile
    const { error: profileError } = await supabaseAdmin
      .from('profile_details')
      .insert(profileData);

    if (profileError) {
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registro completado exitosamente',
        user_id: authData.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration validation error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sanitizeString = (str: string, maxLength: number): string => {
  if (!str) return "";
  return str.trim().substring(0, maxLength);
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Generate a secure random password
const generateSecurePassword = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  return password;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return jsonResponse(401, { success: false, error: "No autorizado." });
    }

    const token = authHeader.replace(/^[Bb]earer\s+/, "").trim();
    if (!token) {
      return jsonResponse(401, { success: false, error: "No autorizado." });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Validate JWT in user context (Lovable Cloud has verify_jwt=false)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      console.error("approve-registration: invalid token", userError);
      return jsonResponse(401, { success: false, error: "No autorizado." });
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("approve-registration: role lookup error", roleError);
    }

    if (!adminRole) {
      return jsonResponse(403, {
        success: false,
        error: "No tienes permisos de administrador.",
      });
    }

    const { requestId, avatar_url } = await req.json();

    if (!requestId) {
      return jsonResponse(400, {
        success: false,
        error: "ID de solicitud es requerido",
      });
    }

    const password = generateSecurePassword();

    // Get the registration request
    const { data: request, error: requestError } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return jsonResponse(404, { success: false, error: "Solicitud no encontrada" });
    }

    if (request.status !== "pending") {
      return jsonResponse(400, {
        success: false,
        error: "Esta solicitud ya fue procesada",
      });
    }

    console.log(`Approving registration for: ${request.email}`);

    // Step 1: Create auth user (or reuse existing one)
    let authUserId: string;

    const { data: authData, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email: request.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: sanitizeString(request.nombre, 200),
        },
      });

    if (signUpError) {
      const msg = signUpError.message ? String(signUpError.message).toLowerCase() : "";
      if (msg.includes("registered") || msg.includes("exists")) {
        // User already exists in auth - find them and reuse
        console.log(`User already exists in auth, looking up: ${request.email}`);
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error("approve-registration: listUsers error", listError);
          return jsonResponse(500, { success: false, error: "No se pudo verificar el usuario existente" });
        }
        const existingUser = listData.users.find(u => u.email === request.email);
        if (!existingUser) {
          return jsonResponse(500, { success: false, error: "No se encontró el usuario existente" });
        }
        authUserId = existingUser.id;

        // Update the password so admin can share new credentials
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: password,
          email_confirm: true,
          user_metadata: { full_name: sanitizeString(request.nombre, 200) },
        });

        // Ensure profile entry in profiles table exists (trigger may have already created it)
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", authUserId)
          .maybeSingle();

        if (!existingProfile) {
          await supabaseAdmin.from("profiles").insert({
            id: authUserId,
            username: request.email.split("@")[0],
            full_name: sanitizeString(request.nombre, 200),
          });
        }

        // Clean up any old profile_details for this user
        await supabaseAdmin.from("profile_details").delete().eq("user_id", authUserId);

        console.log(`Reusing existing auth user: ${authUserId}`);
      } else {
        console.error("approve-registration: createUser error", signUpError);
        return jsonResponse(500, { success: false, error: "No se pudo crear la cuenta" });
      }
    } else if (!authData.user) {
      return jsonResponse(500, { success: false, error: "No se pudo crear la cuenta" });
    } else {
      authUserId = authData.user.id;
    }

    console.log(`Auth user ready: ${authUserId}`);

    // Step 2: Create single profile with primary type + additional types
    const profileTypes: string[] = request.perfil || ["amante_de_la_musica"];
    const primaryType = profileTypes[0];
    const additionalTypes = profileTypes.slice(1);

    const profileData = {
      user_id: authUserId,
      profile_type: primaryType,
      additional_profile_types: additionalTypes,
      avatar_url: avatar_url || null,
      display_name: sanitizeString(request.nombre, 200),
      bio: sanitizeString(request.motivacion, 1000),
      pais: sanitizeString(request.pais || "", 100),
      provincia: request.provincia ? sanitizeString(request.provincia, 100) : null,
      ciudad: sanitizeString(request.ciudad || "", 100),
      email: request.email,
      telefono: request.telefono ? sanitizeString(request.telefono, 20) : null,
    };

    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from("profile_details")
      .insert(profileData)
      .select("id")
      .single();

    const createdProfiles: string[] = [];
    if (profileError) {
      console.error(`Error creating profile:`, profileError);
    } else if (newProfile) {
      createdProfiles.push(newProfile.id);
      console.log(`Profile created: ${newProfile.id} (${primaryType}, additional: ${additionalTypes.join(', ')})`);
    }

    // Step 3: Update registration request status
    const { error: updateError } = await supabaseAdmin
      .from("registration_requests")
      .update({
        status: "approved",
        user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request status:", updateError);
    }

    return jsonResponse(200, {
      success: true,
      message: "Usuario aprobado y creado exitosamente",
      user_id: authUserId,
      profile_ids: createdProfiles,
      email: request.email,
      temp_password: password,
    });
  } catch (error) {
    console.error("Approve registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al procesar la solicitud";
    return jsonResponse(500, { success: false, error: errorMessage });
  }
});

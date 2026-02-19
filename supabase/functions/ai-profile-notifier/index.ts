import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProfileGap {
  userId: string;
  username: string;
  fullName: string;
  missing: string[];
}

function analyzeProfileCompleteness(
  profile: any,
  details: any[]
): string[] {
  const missing: string[] = [];

  if (!profile.avatar_url) missing.push("foto de perfil");
  if (!profile.bio || profile.bio.trim().length < 20) missing.push("una biografía para que tus seguidores sepan quién sos");
  if (!profile.full_name || profile.full_name.trim() === "") missing.push("tu nombre completo");

  if (!details || details.length === 0) {
    missing.push("crear al menos un perfil artístico (músico, DJ, productor, etc.)");
    return missing;
  }

  for (const d of details) {
    const label = d.display_name || d.profile_type;
    if (!d.avatar_url) missing.push(`foto de perfil en tu perfil "${label}"`);
    if (!d.bio || d.bio.trim().length < 10) missing.push(`una descripción en tu perfil "${label}"`);
    if (!d.pais) missing.push(`tu país en el perfil "${label}"`);
    if (!d.ciudad) missing.push(`tu ciudad en el perfil "${label}"`);
    if (!d.genre) missing.push(`tu género musical en el perfil "${label}"`);
  }

  return missing;
}

async function generatePersonalizedMessage(
  username: string,
  fullName: string,
  missing: string[],
  apiKey: string
): Promise<string> {
  const displayName = fullName || username || "artista";
  const missingList = missing.map((m) => `• ${m}`).join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Eres Akasha IA, la asistente virtual de la plataforma Red Akasha (una red de streaming y música latinoamericana).
Tu tono es amigable, cercano, motivador y breve. Usás un estilo informal latinoamericano (vos/tú).
Escribí mensajes directos cortos (máximo 3-4 oraciones) que motiven al usuario a completar su perfil.
NO uses markdown, listas ni formato especial. Solo texto plano como un mensaje de chat.
Firmá siempre como "🌟 Akasha IA".`,
        },
        {
          role: "user",
          content: `Generá un mensaje personalizado para ${displayName} indicándole que le falta completar:\n${missingList}\n\nSé específico mencionando qué le falta pero en tono amigable.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    // Fallback message if AI fails
    return `¡Hola ${displayName}! 👋 Tu perfil en Red Akasha todavía tiene algunos datos por completar: ${missing.slice(0, 3).join(", ")}. ¡Completalo para que más personas te encuentren! 🌟 Akasha IA`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `¡Hola ${displayName}! Completá tu perfil para que más artistas te conozcan. 🌟 Akasha IA`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const maxUsers = body.max_users || 50;

    // Get all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, bio, avatar_url")
      .order("created_at", { ascending: true })
      .limit(500);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No profiles found", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all profile details
    const { data: allDetails } = await supabase
      .from("profile_details")
      .select("user_id, profile_type, display_name, bio, avatar_url, pais, ciudad, genre");

    const detailsByUser = new Map<string, any[]>();
    for (const d of allDetails || []) {
      const list = detailsByUser.get(d.user_id) || [];
      list.push(d);
      detailsByUser.set(d.user_id, list);
    }

    // Find incomplete profiles
    const gaps: ProfileGap[] = [];
    for (const p of profiles) {
      const details = detailsByUser.get(p.id) || [];
      const missing = analyzeProfileCompleteness(p, details);
      if (missing.length > 0) {
        gaps.push({
          userId: p.id,
          username: p.username || "",
          fullName: p.full_name || "",
          missing,
        });
      }
    }

    // Limit
    const toNotify = gaps.slice(0, maxUsers);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          total_incomplete: gaps.length,
          would_notify: toNotify.length,
          details: toNotify.map((g) => ({
            username: g.username,
            fullName: g.fullName,
            missing: g.missing,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create the bot user for sending messages
    // We'll use the admin's ID as sender since there's no bot account
    const senderId = user.id;
    let sentCount = 0;
    const errors: string[] = [];

    for (const gap of toNotify) {
      // Skip sending to self
      if (gap.userId === senderId) continue;

      // Check if we already sent a profile-completion message recently (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentMsg } = await supabase
        .from("direct_messages")
        .select("id")
        .eq("sender_id", senderId)
        .eq("receiver_id", gap.userId)
        .gte("created_at", sevenDaysAgo)
        .ilike("message", "%Akasha IA%")
        .limit(1);

      if (recentMsg && recentMsg.length > 0) continue;

      try {
        const message = await generatePersonalizedMessage(
          gap.username,
          gap.fullName,
          gap.missing,
          LOVABLE_API_KEY
        );

        const { error: insertErr } = await supabase.from("direct_messages").insert({
          sender_id: senderId,
          receiver_id: gap.userId,
          message,
          read: false,
        });

        if (insertErr) {
          errors.push(`${gap.username}: ${insertErr.message}`);
        } else {
          sentCount++;
        }
      } catch (e) {
        errors.push(`${gap.username}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_incomplete: gaps.length,
        sent: sentCount,
        skipped_recent: toNotify.length - sentCount - errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-profile-notifier error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

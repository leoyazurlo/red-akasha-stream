import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAuth(req: Request, supabase: any): Promise<{ userId: string; isAdmin: boolean } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) return null;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  return { userId: data.user.id, isAdmin: !!roleData };
}

async function getPlatformData(supabase: any) {
  // Get comprehensive platform data for analysis
  const [
    { data: users },
    { data: content },
    { data: interactions },
    { data: profiles },
    { data: purchases },
    { data: forumActivity }
  ] = await Promise.all([
    supabase.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("content_uploads").select("id, content_type, views_count, likes_count, created_at, uploader_id").order("created_at", { ascending: false }).limit(500),
    supabase.from("content_likes").select("created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("profile_details").select("id, profile_type, pais, ciudad, genre, created_at"),
    supabase.from("content_purchases").select("amount, created_at, status").eq("status", "completed"),
    supabase.from("forum_threads").select("id, title, views_count, created_at").order("created_at", { ascending: false }).limit(200)
  ]);

  return { users, content, interactions, profiles, purchases, forumActivity };
}

async function generatePredictions(platformData: any, apiKey: string) {
  const systemPrompt = `Eres un analista de datos experto en plataformas musicales y comunidades artísticas.
Analiza los datos proporcionados de la plataforma Red Akasha y genera predicciones precisas.

Debes generar predicciones en formato JSON con la siguiente estructura:
{
  "predictions": [
    {
      "type": "trend|collaboration|content_performance|user_growth|revenue",
      "title": "Título corto de la predicción",
      "description": "Descripción detallada",
      "confidence": 0.0-1.0,
      "time_horizon": "week|month|quarter",
      "data": {
        // Datos específicos de la predicción
      }
    }
  ],
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Recomendación 1", "Recomendación 2"]
}

Genera al menos una predicción de cada tipo cuando los datos lo permitan.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Analiza estos datos de la plataforma y genera predicciones:

USUARIOS Y PERFILES:
- Total usuarios: ${platformData.users?.length || 0}
- Perfiles por tipo: ${JSON.stringify(
  platformData.profiles?.reduce((acc: any, p: any) => {
    acc[p.profile_type] = (acc[p.profile_type] || 0) + 1;
    return acc;
  }, {}) || {}
)}
- Distribución geográfica: ${JSON.stringify(
  platformData.profiles?.reduce((acc: any, p: any) => {
    acc[p.pais || 'Desconocido'] = (acc[p.pais || 'Desconocido'] || 0) + 1;
    return acc;
  }, {}) || {}
)}

CONTENIDO:
- Total contenido: ${platformData.content?.length || 0}
- Por tipo: ${JSON.stringify(
  platformData.content?.reduce((acc: any, c: any) => {
    acc[c.content_type] = (acc[c.content_type] || 0) + 1;
    return acc;
  }, {}) || {}
)}
- Vistas totales: ${platformData.content?.reduce((sum: number, c: any) => sum + (c.views_count || 0), 0) || 0}
- Likes totales: ${platformData.content?.reduce((sum: number, c: any) => sum + (c.likes_count || 0), 0) || 0}

INTERACCIONES RECIENTES (último mes):
- Total interacciones: ${platformData.interactions?.length || 0}

MONETIZACIÓN:
- Total compras: ${platformData.purchases?.length || 0}
- Ingresos totales: $${platformData.purchases?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0).toFixed(2) || '0.00'}

FORO:
- Hilos recientes: ${platformData.forumActivity?.length || 0}
- Temas populares: ${platformData.forumActivity?.slice(0, 5).map((t: any) => t.title).join(', ') || 'Sin datos'}

Genera predicciones basadas en estos datos reales.`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_predictions",
            description: "Generate platform predictions based on data analysis",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["trend", "collaboration", "content_performance", "user_growth", "revenue"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      confidence: { type: "number" },
                      time_horizon: { type: "string", enum: ["week", "month", "quarter", "year"] },
                      data: { type: "object" }
                    },
                    required: ["type", "title", "description", "confidence", "time_horizon"]
                  }
                },
                insights: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["predictions", "insights", "recommendations"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_predictions" } }
    }),
  });

  if (!response.ok) {
    throw new Error(`Prediction generation failed: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No predictions generated");
}

async function generateCollaborationSuggestions(profiles: any[], apiKey: string, supabase: any) {
  if (!profiles || profiles.length < 2) return [];

  const systemPrompt = `Eres un experto en la industria musical que identifica oportunidades de colaboración entre artistas y profesionales.
Analiza los perfiles proporcionados y sugiere las mejores colaboraciones posibles.

Devuelve un JSON con la estructura:
{
  "suggestions": [
    {
      "profile1_id": "uuid",
      "profile2_id": "uuid",
      "compatibility": 0.0-1.0,
      "type": "musical|production|event|content",
      "reasons": ["razón 1", "razón 2"]
    }
  ]
}`;

  const profileSummaries = profiles.slice(0, 50).map(p => ({
    id: p.id,
    type: p.profile_type,
    genre: p.genre,
    city: p.ciudad,
    country: p.pais
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Perfiles disponibles:\n${JSON.stringify(profileSummaries, null, 2)}\n\nSugiere las 10 mejores colaboraciones posibles.` }
      ]
    }),
  });

  if (!response.ok) {
    console.error("Collaboration suggestion failed");
    return [];
  }

  try {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.suggestions || [];
    }
  } catch (e) {
    console.error("Error parsing collaboration suggestions:", e);
  }

  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });

    const auth = await verifyAuth(req, authClient);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "Autenticación requerida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action } = await req.json();

    let result: any;

    switch (action) {
      case "generate_predictions":
        if (!auth.isAdmin) {
          return new Response(
            JSON.stringify({ error: "Solo administradores pueden generar predicciones" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const platformData = await getPlatformData(supabase);
        const predictions = await generatePredictions(platformData, LOVABLE_API_KEY);

        // Save predictions to database
        for (const pred of predictions.predictions) {
          await supabase.from("ia_predictions").insert({
            prediction_type: pred.type,
            title: pred.title,
            description: pred.description,
            confidence_score: pred.confidence,
            time_horizon: pred.time_horizon,
            prediction_data: pred.data || {},
            generated_by: auth.userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          });
        }

        result = predictions;
        break;

      case "get_predictions":
        const { data: activePredictions } = await supabase
          .from("ia_predictions")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        result = { predictions: activePredictions || [] };
        break;

      case "generate_collaborations":
        if (!auth.isAdmin) {
          return new Response(
            JSON.stringify({ error: "Solo administradores pueden generar sugerencias" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: profiles } = await supabase
          .from("profile_details")
          .select("id, profile_type, genre, ciudad, pais");

        const collaborations = await generateCollaborationSuggestions(profiles || [], LOVABLE_API_KEY, supabase);

        // Save collaboration suggestions
        for (const collab of collaborations) {
          await supabase.from("ia_collaboration_suggestions").upsert({
            profile_1_id: collab.profile1_id,
            profile_2_id: collab.profile2_id,
            compatibility_score: collab.compatibility,
            collaboration_type: collab.type,
            reasons: collab.reasons
          }, { onConflict: "profile_1_id,profile_2_id" });
        }

        result = { collaborations };
        break;

      case "get_my_collaborations":
        const { data: userProfiles } = await supabase
          .from("profile_details")
          .select("id")
          .eq("user_id", auth.userId);

        const profileIds = userProfiles?.map(p => p.id) || [];

        if (profileIds.length === 0) {
          result = { collaborations: [] };
          break;
        }

        const { data: myCollabs } = await supabase
          .from("ia_collaboration_suggestions")
          .select(`
            *,
            profile1:profile_1_id(id, display_name, profile_type, avatar_url),
            profile2:profile_2_id(id, display_name, profile_type, avatar_url)
          `)
          .or(`profile_1_id.in.(${profileIds.join(',')}),profile_2_id.in.(${profileIds.join(',')})`)
          .order("compatibility_score", { ascending: false })
          .limit(10);

        result = { collaborations: myCollabs || [] };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("akasha-ia-predictions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

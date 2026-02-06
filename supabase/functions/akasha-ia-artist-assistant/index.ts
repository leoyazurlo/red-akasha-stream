import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAuth(req: Request, supabase: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) return null;
  return { userId: data.user.id };
}

// Get user's profile data for context
async function getUserProfileContext(supabase: any, userId: string) {
  const { data: profiles } = await supabase
    .from("profile_details")
    .select("*")
    .eq("user_id", userId);

  const { data: content } = await supabase
    .from("content_uploads")
    .select("id, title, content_type, views_count, likes_count, created_at")
    .eq("uploader_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: user } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", userId)
    .single();

  return { profiles, content, user };
}

// Profile creation assistant
async function assistProfileCreation(context: any, profileType: string, apiKey: string) {
  const systemPrompt = `Eres un experto en marketing musical y branding de artistas. 
Tu objetivo es ayudar a crear un perfil profesional atractivo para la plataforma Red Akasha.

El usuario quiere crear un perfil de tipo: ${profileType}

Basándote en el contexto proporcionado, genera sugerencias para:
1. Nombre artístico/de proyecto (si aplica)
2. Biografía atractiva (máximo 300 palabras)
3. Géneros musicales recomendados
4. Tags para mejor visibilidad
5. Consejos para la foto de perfil y portada
6. Redes sociales que debería conectar

Devuelve la respuesta en formato JSON estructurado.`;

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
        { role: "user", content: `Contexto del usuario:\n${JSON.stringify(context, null, 2)}\n\nGenera sugerencias para el perfil.` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "profile_suggestions",
            description: "Generate profile creation suggestions",
            parameters: {
              type: "object",
              properties: {
                artist_name: { type: "string", description: "Suggested artist/project name" },
                biography: { type: "string", description: "Suggested biography text" },
                genres: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                photo_tips: { type: "array", items: { type: "string" } },
                social_networks: { type: "array", items: { type: "string" } },
                additional_tips: { type: "array", items: { type: "string" } }
              },
              required: ["biography", "genres", "tags"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "profile_suggestions" } }
    }),
  });

  if (!response.ok) throw new Error(`Profile assist failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No suggestions generated");
}

// Content optimization assistant
async function optimizeContent(content: any, contentType: string, apiKey: string) {
  const systemPrompt = `Eres un experto en optimización de contenido para plataformas de streaming musical.
Analiza el contenido proporcionado y sugiere mejoras para maximizar visibilidad y engagement.

Tipo de contenido: ${contentType}

Analiza y sugiere:
1. Mejoras en el título (SEO y atractivo)
2. Descripción optimizada
3. Tags recomendados
4. Mejor horario para publicar
5. Thumbnail tips
6. Estrategia de promoción

Responde en JSON estructurado.`;

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
        { role: "user", content: `Contenido a optimizar:\n${JSON.stringify(content, null, 2)}` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "content_optimization",
            description: "Generate content optimization suggestions",
            parameters: {
              type: "object",
              properties: {
                title_suggestions: { type: "array", items: { type: "string" } },
                optimized_description: { type: "string" },
                recommended_tags: { type: "array", items: { type: "string" } },
                best_publish_time: { type: "string" },
                thumbnail_tips: { type: "array", items: { type: "string" } },
                promotion_strategy: { type: "array", items: { type: "string" } },
                engagement_tips: { type: "array", items: { type: "string" } }
              },
              required: ["title_suggestions", "optimized_description", "recommended_tags"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "content_optimization" } }
    }),
  });

  if (!response.ok) throw new Error(`Content optimization failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No optimization suggestions generated");
}

// Presence management - analyze and suggest improvements
async function analyzePresence(context: any, apiKey: string) {
  const { profiles, content, user } = context;

  const systemPrompt = `Eres un manager de artistas digitales experto en presencia online.
Analiza la presencia actual del artista y genera un informe completo con recomendaciones.

Evalúa:
1. Completitud del perfil (0-100%)
2. Actividad de contenido
3. Engagement (si hay datos)
4. Áreas de mejora prioritarias
5. Próximos pasos recomendados
6. Comparación con mejores prácticas

Sé específico y actionable en las recomendaciones.`;

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
        { role: "user", content: `Datos del artista:\n\nUsuario: ${JSON.stringify(user)}\n\nPerfiles: ${JSON.stringify(profiles)}\n\nContenido reciente: ${JSON.stringify(content)}` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "presence_analysis",
            description: "Analyze artist presence and generate recommendations",
            parameters: {
              type: "object",
              properties: {
                profile_completeness: { type: "number" },
                content_activity_score: { type: "number" },
                engagement_score: { type: "number" },
                overall_score: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                priority_actions: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      impact: { type: "string" }
                    }
                  } 
                },
                content_calendar: { type: "array", items: { type: "string" } },
                growth_tips: { type: "array", items: { type: "string" } }
              },
              required: ["profile_completeness", "overall_score", "priority_actions"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "presence_analysis" } }
    }),
  });

  if (!response.ok) throw new Error(`Presence analysis failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No presence analysis generated");
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
    const { action, data } = await req.json();

    let result: any;

    switch (action) {
      case "assist_profile_creation":
        const profileContext = await getUserProfileContext(supabase, auth.userId);
        result = await assistProfileCreation(profileContext, data.profileType, LOVABLE_API_KEY);
        break;

      case "optimize_content":
        result = await optimizeContent(data.content, data.contentType, LOVABLE_API_KEY);
        break;

      case "analyze_presence":
        const fullContext = await getUserProfileContext(supabase, auth.userId);
        result = await analyzePresence(fullContext, LOVABLE_API_KEY);
        break;

      case "get_content_suggestions":
        const { data: userContent } = await supabase
          .from("content_uploads")
          .select("*")
          .eq("uploader_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(10);
        
        result = { content: userContent || [] };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("akasha-ia-artist-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

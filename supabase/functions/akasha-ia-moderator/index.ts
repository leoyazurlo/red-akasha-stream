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

// Analyze content for spam, toxicity, and appropriateness
async function analyzeContent(content: string, contentType: string, apiKey: string) {
  const systemPrompt = `Eres un moderador de contenido experto para una plataforma de música y arte.
Analiza el contenido proporcionado y evalúa:

1. SPAM: ¿Es contenido promocional excesivo, enlaces sospechosos, o repetitivo?
2. TOXICIDAD: ¿Contiene insultos, odio, acoso, o contenido ofensivo?
3. APROPIADO: ¿Es apropiado para la comunidad musical/artística?
4. CALIDAD: ¿Es contenido de valor para la comunidad?

Tipo de contenido: ${contentType}

Devuelve un análisis detallado con puntuaciones y recomendaciones.`;

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
        { role: "user", content: `Analiza este contenido:\n\n"${content}"` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "content_analysis",
            description: "Analyze content for moderation",
            parameters: {
              type: "object",
              properties: {
                spam_score: { type: "number", description: "0-100, where 100 is definitely spam" },
                toxicity_score: { type: "number", description: "0-100, where 100 is highly toxic" },
                appropriateness_score: { type: "number", description: "0-100, where 100 is perfectly appropriate" },
                quality_score: { type: "number", description: "0-100, where 100 is high quality content" },
                is_spam: { type: "boolean" },
                is_toxic: { type: "boolean" },
                is_appropriate: { type: "boolean" },
                flags: { type: "array", items: { type: "string" } },
                recommended_action: { 
                  type: "string", 
                  enum: ["approve", "review", "warn", "remove", "ban_user"] 
                },
                explanation: { type: "string" },
                suggested_improvements: { type: "array", items: { type: "string" } }
              },
              required: ["spam_score", "toxicity_score", "is_spam", "is_toxic", "recommended_action"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "content_analysis" } }
    }),
  });

  if (!response.ok) throw new Error(`Content analysis failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No analysis generated");
}

// Suggest category for forum content
async function suggestCategory(title: string, content: string, categories: any[], apiKey: string) {
  const systemPrompt = `Eres un experto en categorización de contenido para foros de música y arte.
Analiza el título y contenido del post y sugiere la categoría más apropiada.

Categorías disponibles:
${categories.map(c => `- ${c.nombre}: ${c.descripcion || 'Sin descripción'}`).join('\n')}

Devuelve la categoría más apropiada y alternativas si aplica.`;

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
        { role: "user", content: `Título: ${title}\n\nContenido: ${content}` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "category_suggestion",
            description: "Suggest appropriate category for content",
            parameters: {
              type: "object",
              properties: {
                primary_category: { type: "string" },
                confidence: { type: "number" },
                alternative_categories: { type: "array", items: { type: "string" } },
                reasoning: { type: "string" },
                tags_suggested: { type: "array", items: { type: "string" } }
              },
              required: ["primary_category", "confidence"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "category_suggestion" } }
    }),
  });

  if (!response.ok) throw new Error(`Category suggestion failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No category suggestion generated");
}

// Analyze forum health and trends
async function analyzeForumHealth(supabase: any, apiKey: string) {
  // Get recent forum data
  const [
    { data: recentThreads },
    { data: recentPosts },
    { data: reports },
    { data: categories }
  ] = await Promise.all([
    supabase.from("forum_threads").select("id, title, views_count, created_at, subforo_id").order("created_at", { ascending: false }).limit(100),
    supabase.from("forum_posts").select("id, content, created_at, author_id").order("created_at", { ascending: false }).limit(200),
    supabase.from("forum_reports").select("*").eq("status", "pending"),
    supabase.from("forum_categories").select("id, nombre, descripcion")
  ]);

  const systemPrompt = `Eres un analista de comunidades online especializado en foros de música.
Analiza la salud del foro y genera un informe completo con:

1. Actividad general (tendencia)
2. Temas populares
3. Áreas problemáticas
4. Usuarios más activos (sin identificar específicamente)
5. Recomendaciones de moderación
6. Sugerencias para mejorar engagement`;

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
        { role: "user", content: `Datos del foro:\n\nHilos recientes: ${recentThreads?.length || 0}\nPosts recientes: ${recentPosts?.length || 0}\nReportes pendientes: ${reports?.length || 0}\nCategorías: ${categories?.map(c => c.nombre).join(', ')}\n\nTítulos de hilos:\n${recentThreads?.slice(0, 20).map(t => t.title).join('\n')}` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "forum_health_analysis",
            description: "Analyze forum health and provide insights",
            parameters: {
              type: "object",
              properties: {
                health_score: { type: "number", description: "0-100 overall health" },
                activity_trend: { type: "string", enum: ["growing", "stable", "declining"] },
                trending_topics: { type: "array", items: { type: "string" } },
                problem_areas: { type: "array", items: { type: "string" } },
                moderation_recommendations: { type: "array", items: { type: "string" } },
                engagement_suggestions: { type: "array", items: { type: "string" } },
                content_gaps: { type: "array", items: { type: "string" } },
                spam_risk_level: { type: "string", enum: ["low", "medium", "high"] },
                pending_actions: { type: "number" }
              },
              required: ["health_score", "activity_trend", "moderation_recommendations"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "forum_health_analysis" } }
    }),
  });

  if (!response.ok) throw new Error(`Forum analysis failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    const result = JSON.parse(toolCall.function.arguments);
    result.pending_reports = reports?.length || 0;
    return result;
  }

  throw new Error("No forum analysis generated");
}

// Batch analyze multiple posts for moderation
async function batchModerate(posts: any[], apiKey: string) {
  const results = [];
  
  for (const post of posts.slice(0, 10)) { // Limit to 10 posts per batch
    try {
      const analysis = await analyzeContent(
        post.content || post.title || "", 
        post.type || "post",
        apiKey
      );
      results.push({
        post_id: post.id,
        ...analysis
      });
    } catch (e) {
      results.push({
        post_id: post.id,
        error: e instanceof Error ? e.message : "Analysis failed"
      });
    }
  }

  return results;
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
      case "analyze_content":
        result = await analyzeContent(data.content, data.contentType || "post", LOVABLE_API_KEY);
        break;

      case "suggest_category":
        const { data: categories } = await supabase
          .from("forum_categories")
          .select("id, nombre, descripcion");
        
        result = await suggestCategory(data.title, data.content, categories || [], LOVABLE_API_KEY);
        break;

      case "analyze_forum_health":
        if (!auth.isAdmin) {
          return new Response(
            JSON.stringify({ error: "Solo administradores pueden analizar el foro" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await analyzeForumHealth(supabase, LOVABLE_API_KEY);
        break;

      case "batch_moderate":
        if (!auth.isAdmin) {
          return new Response(
            JSON.stringify({ error: "Solo administradores pueden moderar en lote" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await batchModerate(data.posts || [], LOVABLE_API_KEY);
        break;

      case "get_pending_reports":
        if (!auth.isAdmin) {
          return new Response(
            JSON.stringify({ error: "Solo administradores pueden ver reportes" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: pendingReports } = await supabase
          .from("forum_reports")
          .select(`
            *,
            thread:thread_id(id, title, content),
            post:post_id(id, content),
            reporter:reporter_id(username, full_name)
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        
        result = { reports: pendingReports || [] };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("akasha-ia-moderator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

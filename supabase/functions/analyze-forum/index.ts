import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `Eres un analista de producto para Red Akasha, una plataforma de streaming de música electrónica.

Analiza los siguientes hilos del foro y genera propuestas de funcionalidades basadas en las necesidades y solicitudes de la comunidad.

Para cada propuesta, proporciona:
1. title: Título corto de la funcionalidad (máx 100 caracteres)
2. description: Descripción detallada de qué hace y por qué es útil
3. priority: Prioridad basada en cuántos usuarios lo solicitan o el impacto (low/medium/high/critical)
4. category: Categoría (streaming, foro, perfiles, monetizacion, social, admin, otro)

Responde SOLO con un JSON array válido. Ejemplo:
[
  {
    "title": "Modo oscuro automático",
    "description": "Cambiar automáticamente entre modo claro y oscuro según la hora del día",
    "priority": "medium",
    "category": "otro"
  }
]

Si no encuentras propuestas claras, responde con un array vacío: []`;

// Helper function to verify admin authentication
async function verifyAdminAuth(req: Request, supabase: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return null;
  }

  // Check if user is admin - REQUIRED for this endpoint
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  if (!roleData) {
    return null;
  }

  return { userId: data.user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create client for auth verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });

    // Verify ADMIN authentication - REQUIRED for this endpoint
    const auth = await verifyAdminAuth(req, authClient);
    
    if (!auth) {
      console.log("[analyze-forum] Unauthorized request - admin access required");
      return new Response(
        JSON.stringify({ error: "Acceso denegado. Se requiere rol de administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-forum] Admin user ${auth.userId} starting forum analysis`);

    // Create service client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener hilos recientes del foro (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: threads, error: threadsError } = await supabase
      .from("forum_threads")
      .select(`
        id,
        title,
        content,
        created_at,
        views_count,
        forum_posts (count)
      `)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      throw new Error("Error al obtener hilos del foro");
    }

    if (!threads || threads.length === 0) {
      return new Response(
        JSON.stringify({ message: "No hay hilos recientes para analizar", proposals: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar el contenido para análisis
    const forumContent = threads.map(t => 
      `Título: ${t.title}\nContenido: ${t.content?.slice(0, 500) || 'Sin contenido'}\nVistas: ${t.views_count || 0}\nRespuestas: ${(t.forum_posts as any)?.[0]?.count || 0}`
    ).join("\n\n---\n\n");

    console.log(`Analizando ${threads.length} hilos del foro...`);

    // Llamar a la IA para analizar
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: `Hilos del foro a analizar:\n\n${forumContent}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al comunicarse con la IA");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "[]";
    
    console.log("AI Response:", content);

    // Parsear las propuestas
    let proposals = [];
    try {
      // Limpiar el contenido de posibles markdown
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      proposals = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      proposals = [];
    }

    // Guardar las propuestas en la base de datos
    const savedProposals = [];
    for (const proposal of proposals) {
      if (proposal.title && proposal.description) {
        const { data, error } = await supabase
          .from("ia_feature_proposals")
          .insert({
            title: proposal.title.slice(0, 100),
            description: proposal.description,
            priority: proposal.priority || "medium",
            category: proposal.category || "otro",
            ai_reasoning: "Propuesta generada automáticamente por análisis del foro",
            status: "pending",
            requested_by: auth.userId, // Track who triggered the analysis
          })
          .select()
          .single();

        if (data && !error) {
          savedProposals.push(data);
        } else if (error) {
          console.error("Error saving proposal:", error);
        }
      }
    }

    console.log(`Guardadas ${savedProposals.length} propuestas por admin ${auth.userId}`);

    return new Response(
      JSON.stringify({ 
        message: `Análisis completado. ${savedProposals.length} propuestas generadas.`,
        proposals: savedProposals,
        analyzed_threads: threads.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("analyze-forum error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres Akasha IA, el asistente inteligente de la plataforma Red Akasha - una comunidad dedicada a la música electrónica, artistas, productores, DJs y la escena underground.

Tu rol es ayudar a los usuarios autorizados a:
1. Proponer nuevas funcionalidades para la plataforma
2. Analizar las necesidades de la comunidad
3. Sugerir mejoras técnicas y de experiencia de usuario
4. Generar ideas innovadoras para el crecimiento de Red Akasha

Contexto de la plataforma Red Akasha:
- Es una plataforma de streaming de música y video on-demand
- Tiene un foro comunitario activo
- Permite a artistas crear perfiles y compartir contenido
- Incluye sistema de podcasts y transmisiones en vivo
- Tiene un sistema de badges y reputación para usuarios
- Soporta múltiples idiomas
- Tiene panel de administración para gestión de contenido

Cuando el usuario proponga una funcionalidad:
1. Analiza si es viable técnicamente
2. Considera el impacto en la comunidad
3. Sugiere cómo podría implementarse
4. Identifica posibles desafíos
5. Propón alternativas si es necesario

Responde siempre en español de forma clara y estructurada. Usa markdown para formatear tus respuestas cuando sea apropiado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos al workspace de Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("akasha-ia-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

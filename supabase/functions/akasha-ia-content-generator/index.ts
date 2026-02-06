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

// Generate artist biography
async function generateBio(context: any, style: string, length: string, apiKey: string) {
  const lengthGuide = {
    short: "50-100 palabras",
    medium: "150-250 palabras", 
    long: "300-500 palabras"
  };

  const styleGuide = {
    professional: "formal y profesional, enfocado en logros y experiencia",
    creative: "artístico y creativo, con metáforas y lenguaje evocador",
    casual: "relajado y cercano, como si hablara directamente al fan",
    mysterious: "enigmático e intrigante, dejando curiosidad"
  };

  const systemPrompt = `Eres un copywriter experto en la industria musical.
Genera una biografía de artista con las siguientes características:
- Longitud: ${lengthGuide[length as keyof typeof lengthGuide] || lengthGuide.medium}
- Estilo: ${styleGuide[style as keyof typeof styleGuide] || styleGuide.professional}

La biografía debe:
1. Capturar la esencia del artista
2. Mencionar géneros y estilo musical
3. Incluir logros destacados (si hay)
4. Conectar emocionalmente con el lector
5. Terminar con un call-to-action sutil

Devuelve SOLO la biografía, sin explicaciones adicionales.`;

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
        { role: "user", content: `Información del artista:\n${JSON.stringify(context, null, 2)}\n\nGenera la biografía.` }
      ]
    }),
  });

  if (!response.ok) throw new Error(`Bio generation failed: ${response.status}`);

  const data = await response.json();
  return { biography: data.choices?.[0]?.message?.content || "" };
}

// Generate content description
async function generateDescription(content: any, platform: string, apiKey: string) {
  const platformGuide = {
    redakasha: "descripción completa para Red Akasha, puede ser detallada",
    youtube: "descripción optimizada para YouTube SEO, con timestamps si aplica",
    instagram: "caption corto y atractivo con emojis, max 150 caracteres",
    twitter: "tweet conciso y llamativo, max 280 caracteres",
    facebook: "post engaging para Facebook, longitud media"
  };

  const systemPrompt = `Eres un experto en marketing de contenido musical.
Genera una descripción para el contenido optimizada para: ${platform}

Guía de plataforma: ${platformGuide[platform as keyof typeof platformGuide] || platformGuide.redakasha}

La descripción debe:
1. Capturar la atención inmediatamente
2. Describir el contenido de forma atractiva
3. Incluir call-to-action apropiado
4. Usar hashtags relevantes (si la plataforma lo permite)`;

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
        { role: "user", content: `Contenido:\nTítulo: ${content.title}\nTipo: ${content.type}\nDetalles: ${content.details || 'No especificados'}\n\nGenera la descripción.` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "content_description",
            description: "Generate optimized content description",
            parameters: {
              type: "object",
              properties: {
                description: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                call_to_action: { type: "string" },
                character_count: { type: "number" }
              },
              required: ["description"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "content_description" } }
    }),
  });

  if (!response.ok) throw new Error(`Description generation failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  // Fallback to regular content
  return { description: data.choices?.[0]?.message?.content || "" };
}

// Generate promotional text
async function generatePromoText(event: any, tone: string, apiKey: string) {
  const toneGuide = {
    hype: "muy energético y emocionante, usa mayúsculas estratégicas y emojis",
    elegant: "sofisticado y elegante, lenguaje refinado",
    underground: "estilo underground, auténtico y raw",
    mainstream: "accesible y comercial, fácil de entender"
  };

  const systemPrompt = `Eres un experto en promoción de eventos musicales.
Genera texto promocional con el tono: ${toneGuide[tone as keyof typeof toneGuide] || toneGuide.hype}

El texto debe:
1. Crear urgencia (FOMO)
2. Destacar los elementos únicos
3. Incluir información clave (fecha, lugar, artistas)
4. Tener un call-to-action claro
5. Ser compartible en redes sociales`;

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
        { role: "user", content: `Evento a promocionar:\n${JSON.stringify(event, null, 2)}\n\nGenera el texto promocional.` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "promo_text",
            description: "Generate promotional text for event",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "Título principal impactante" },
                body: { type: "string", description: "Cuerpo del texto promocional" },
                short_version: { type: "string", description: "Versión corta para stories/tweets" },
                hashtags: { type: "array", items: { type: "string" } },
                call_to_action: { type: "string" },
                urgency_phrase: { type: "string" }
              },
              required: ["headline", "body", "short_version"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "promo_text" } }
    }),
  });

  if (!response.ok) throw new Error(`Promo text generation failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No promo text generated");
}

// Generate social media post ideas
async function generateSocialIdeas(profile: any, platform: string, count: number, apiKey: string) {
  const systemPrompt = `Eres un community manager experto en artistas musicales.
Genera ${count} ideas de posts para ${platform} basándote en el perfil del artista.

Cada idea debe incluir:
1. Concepto del post
2. Copy sugerido
3. Tipo de contenido (foto, video, story, reel, etc.)
4. Mejor horario para publicar
5. Hashtags recomendados`;

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
        { role: "user", content: `Perfil del artista:\n${JSON.stringify(profile, null, 2)}\n\nGenera las ideas.` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "social_ideas",
            description: "Generate social media post ideas",
            parameters: {
              type: "object",
              properties: {
                ideas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      concept: { type: "string" },
                      copy: { type: "string" },
                      content_type: { type: "string" },
                      best_time: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      engagement_tip: { type: "string" }
                    }
                  }
                },
                content_calendar_suggestion: { type: "string" }
              },
              required: ["ideas"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "social_ideas" } }
    }),
  });

  if (!response.ok) throw new Error(`Social ideas generation failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No social ideas generated");
}

// Generate press release
async function generatePressRelease(info: any, apiKey: string) {
  const systemPrompt = `Eres un publicista musical profesional.
Genera un comunicado de prensa profesional siguiendo el formato estándar:
1. Titular impactante
2. Subtítulo
3. Ciudad, fecha - Lead paragraph
4. Cuerpo con citas
5. Boilerplate del artista
6. Información de contacto

El comunicado debe ser profesional, noticioso y atractivo para periodistas.`;

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
        { role: "user", content: `Información para el comunicado:\n${JSON.stringify(info, null, 2)}\n\nGenera el comunicado de prensa.` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "press_release",
            description: "Generate professional press release",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string" },
                subheadline: { type: "string" },
                dateline: { type: "string" },
                lead_paragraph: { type: "string" },
                body_paragraphs: { type: "array", items: { type: "string" } },
                quote: { type: "string" },
                quote_attribution: { type: "string" },
                boilerplate: { type: "string" },
                full_text: { type: "string" }
              },
              required: ["headline", "lead_paragraph", "full_text"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "press_release" } }
    }),
  });

  if (!response.ok) throw new Error(`Press release generation failed: ${response.status}`);

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  throw new Error("No press release generated");
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

    const { action, data } = await req.json();

    let result: any;

    switch (action) {
      case "generate_bio":
        result = await generateBio(
          data.context, 
          data.style || "professional", 
          data.length || "medium",
          LOVABLE_API_KEY
        );
        break;

      case "generate_description":
        result = await generateDescription(
          data.content,
          data.platform || "redakasha",
          LOVABLE_API_KEY
        );
        break;

      case "generate_promo":
        result = await generatePromoText(
          data.event,
          data.tone || "hype",
          LOVABLE_API_KEY
        );
        break;

      case "generate_social_ideas":
        result = await generateSocialIdeas(
          data.profile,
          data.platform || "instagram",
          data.count || 5,
          LOVABLE_API_KEY
        );
        break;

      case "generate_press_release":
        result = await generatePressRelease(data.info, LOVABLE_API_KEY);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("akasha-ia-content-generator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

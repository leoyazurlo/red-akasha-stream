import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Verify user authentication
async function verifyAuth(req: Request, supabase: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) return null;
  return { userId: data.user.id };
}

// Analyze image with AI
async function analyzeImage(imageUrl: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Analiza esta imagen en detalle. Si es un diseño, describe los elementos. Si es un flyer o póster, extrae la información del evento. Si es arte, describe el estilo y elementos." },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No se pudo analizar la imagen";
}

// Analyze document/text content
async function analyzeDocument(content: string, fileType: string, apiKey: string): Promise<string> {
  const systemPrompt = `Eres un asistente experto en análisis de documentos para la industria musical. 
Analiza el siguiente ${fileType} y extrae:
- Información clave (nombres, fechas, montos, requisitos)
- Resumen ejecutivo
- Puntos de acción o tareas pendientes
- Alertas o aspectos importantes a considerar
- Si es código, analiza su estructura, calidad y posibles mejoras`;

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
        { role: "user", content: `Contenido del documento:\n\n${content}` }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Document analysis failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No se pudo analizar el documento";
}

// Analyze audio (music analysis)
async function analyzeAudioMetadata(metadata: any, apiKey: string): Promise<string> {
  const systemPrompt = `Eres un experto en análisis musical. Basándote en los metadatos del audio proporcionados, proporciona:
- Género musical probable
- Estado de ánimo/mood
- BPM estimado (si es posible)
- Sugerencias de tags para categorización
- Artistas similares potenciales
- Recomendaciones de uso (live sets, podcasts, etc.)`;

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
        { role: "user", content: `Metadatos del archivo de audio:\n${JSON.stringify(metadata, null, 2)}` }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Audio analysis failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No se pudo analizar el audio";
}

// Get artist/profile context for image generation
async function getProfileContextForImage(supabase: any, searchTerms: string[]): Promise<string> {
  try {
    // Search for matching profiles by name
    let contextInfo = "";
    
    for (const term of searchTerms) {
      const { data: profiles } = await supabase
        .from("profile_details")
        .select(`
          id,
          display_name,
          bio,
          avatar_url,
          profile_type,
          ciudad,
          pais,
          genre,
          venue_type,
          capacity
        `)
        .or(`display_name.ilike.%${term}%,bio.ilike.%${term}%`)
        .limit(3);
      
      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          // Get gallery images for this profile
          const { data: gallery } = await supabase
            .from("profile_galleries")
            .select("url, description")
            .eq("profile_id", p.id)
            .limit(5);
          
          contextInfo += `\n## Perfil: ${p.display_name}\n`;
          contextInfo += `- Tipo: ${p.profile_type}\n`;
          if (p.bio) contextInfo += `- Descripción: ${p.bio}\n`;
          if (p.ciudad) contextInfo += `- Ubicación: ${p.ciudad}, ${p.pais}\n`;
          if (p.genre) contextInfo += `- Género: ${p.genre}\n`;
          if (p.venue_type) contextInfo += `- Tipo de venue: ${p.venue_type}\n`;
          if (p.capacity) contextInfo += `- Capacidad: ${p.capacity}\n`;
          if (p.avatar_url) contextInfo += `- Foto principal: ${p.avatar_url}\n`;
          if (gallery && gallery.length > 0) {
            contextInfo += `- Galería de fotos: ${gallery.map((g: any) => g.url).join(", ")}\n`;
          }
        }
      }
    }
    
    return contextInfo;
  } catch (error) {
    console.error("Error getting profile context:", error);
    return "";
  }
}

// Generate image with context
async function generateImage(prompt: string, style: string, apiKey: string, artistContext: string = ""): Promise<{ imageUrl: string; description: string }> {
  let fullPrompt = style 
    ? `${prompt}. Estilo artístico: ${style}. Alta calidad, profesional, para industria musical.`
    : `${prompt}. Diseño profesional para industria musical, moderno, atractivo.`;

  // Add artist context if available
  if (artistContext) {
    fullPrompt = `${fullPrompt}\n\nCONTEXTO DE REFERENCIA (usa esta información para hacer la imagen más fiel a la realidad):\n${artistContext}`;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        { role: "user", content: fullPrompt }
      ],
      modalities: ["image", "text"]
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const imageUrl = message?.images?.[0]?.image_url?.url || null;
  const description = message?.content || "";

  if (!imageUrl) {
    throw new Error("No image was generated");
  }

  return { imageUrl, description };
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
      case "analyze_image":
        result = await analyzeImage(data.imageUrl, data.prompt, LOVABLE_API_KEY);
        
        // Save analysis to database
        await supabase.from("ia_uploaded_files").update({
          analysis_status: "completed",
          analysis_result: { text: result }
        }).eq("id", data.fileId);
        
        break;

      case "analyze_document":
        result = await analyzeDocument(data.content, data.fileType, LOVABLE_API_KEY);
        
        if (data.fileId) {
          await supabase.from("ia_uploaded_files").update({
            analysis_status: "completed",
            analysis_result: { text: result },
            extracted_text: data.content
          }).eq("id", data.fileId);
        }
        break;

      case "analyze_audio":
        result = await analyzeAudioMetadata(data.metadata, LOVABLE_API_KEY);
        
        if (data.fileId) {
          await supabase.from("ia_uploaded_files").update({
            analysis_status: "completed",
            analysis_result: { text: result },
            metadata: data.metadata
          }).eq("id", data.fileId);
        }
        break;

      case "generate_image":
        // Extract keywords from prompt to search for relevant profiles
        const promptWords = data.prompt.toLowerCase().split(/\s+/);
        const searchTerms = promptWords.filter((w: string) => w.length > 3);
        
        // Get context for any mentioned artists/venues
        const artistContext = await getProfileContextForImage(supabase, searchTerms);
        
        const imageResult = await generateImage(data.prompt, data.style, LOVABLE_API_KEY, artistContext);
        
        // Save generated image record
        const { data: savedImage } = await supabase.from("ia_generated_images").insert({
          user_id: auth.userId,
          conversation_id: data.conversationId || null,
          prompt: data.prompt,
          image_url: imageResult.imageUrl,
          image_type: data.imageType || "general",
          style: data.style || null,
          metadata: { description: imageResult.description, artistContext: artistContext ? true : false }
        }).select().single();
        
        result = { ...imageResult, id: savedImage?.id };
        break;

      case "transcribe_voice":
        // For voice transcription, we'll use the chat API with audio understanding
        // Note: Full transcription would require ElevenLabs or similar service
        result = {
          transcription: data.transcription || "",
          message: "Transcripción recibida"
        };
        
        if (data.conversationId) {
          await supabase.from("ia_voice_transcriptions").insert({
            user_id: auth.userId,
            conversation_id: data.conversationId,
            transcription: data.transcription,
            language: data.language || "es",
            duration_seconds: data.duration || null
          });
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("akasha-ia-multimodal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

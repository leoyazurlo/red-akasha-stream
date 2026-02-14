import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Version tracking for deployment verification
const VERSION = "v1.2.0";
const DEPLOYED_AT = new Date().toISOString();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_CONTEXT = `Red Akasha es una plataforma digital colaborativa y open-source para la música y el arte emergente. Es una red que busca dar voz y voto a artistas, músicos, productores, venues y amantes del arte, con gobernanza comunitaria y tecnológica. En esencia: una alternativa justa y transparente a la industria musical tradicional, construida por y para la comunidad.
Stack técnico: React + TypeScript + Supabase (PostgreSQL + Edge Functions).
Módulos: VOD, Live Streaming, Perfiles (DJ/Músico/Venue/etc), Foro, Monetización, Admin Panel.`;

const getSystemPrompt = (platformStats: string, isAdmin: boolean) => {
  const adminBlock = isAdmin
    ? `## MODO ADMINISTRADOR (acceso completo)
Tienes acceso libre para hablar de cualquier tema: desarrollo, arquitectura, funcionalidades, marketing, análisis de datos, propuestas técnicas, gobernanza, y todo lo que el administrador necesite.`
    : `## MODO USUARIO
Solo puedes ayudar con temas relacionados a:
- Música, artistas, géneros musicales, producción musical
- Uso de la plataforma Red Akasha (perfiles, contenido, foro, playlists)
- Consejos para artistas emergentes, promoción musical, branding
- Datos y estadísticas de la plataforma relacionados con música y arte
- Ideas y sugerencias para la comunidad musical

Si el usuario pregunta algo fuera de estos temas, responde amablemente que solo puedes asistir con temas musicales y de la plataforma Red Akasha.`;

  return `Eres Akasha IA, la inteligencia artificial de Red Akasha.

## ¿QUÉ ES RED AKASHA?
Red Akasha es una plataforma digital colaborativa y open-source para la música y el arte emergente. Es una red que busca dar voz y voto a artistas, músicos, productores, venues y amantes del arte, con gobernanza comunitaria y tecnológica. Una alternativa justa y transparente a la industria musical tradicional, construida por y para la comunidad.

${PLATFORM_CONTEXT}

${platformStats}

${adminBlock}

## INSTRUCCIONES CRÍTICAS:

1. **IDENTIDAD**: Siempre que te pregunten qué es Red Akasha, responde con el concepto anterior. Eres parte de esta plataforma.

2. **APRENDE DE LOS DATOS**: Usa las estadísticas, perfiles de artistas y contenido de la plataforma para generar ideas, detectar tendencias y proponer mejoras musicales.

3. **RESPUESTAS BREVES**: Máximo 3-5 párrafos. Sé directo y conciso.

4. **CUANDO PROPONGAS FUNCIONALIDADES**, usa este formato corto:
   - **Idea**: Una línea describiendo la propuesta
   - **Impacto**: A quién beneficia
   - **Próximo paso**: Qué hacer ahora

5. **PARA PREGUNTAS SIMPLES**: Responde en 1-2 oraciones.

6. **USA LOS DATOS** de artistas y estadísticas cuando sean relevantes, pero no los listes completos.

7. **NO GENERES LISTAS LARGAS** de posibilidades. Elige la mejor opción y proponla.

Responde siempre en español, de forma clara y CONCISA.`;
};

// Función para obtener contexto completo de artistas y perfiles
async function getArtistsAndProfilesContext(supabase: any): Promise<string> {
  try {
    // Obtener todos los perfiles con sus datos completos
    const { data: profiles } = await supabase
      .from("profile_details")
      .select(`
        id,
        user_id,
        profile_type,
        display_name,
        bio,
        avatar_url,
        ciudad,
        pais,
        provincia,
        instagram,
        facebook,
        linkedin,
        whatsapp,
        telefono,
        genre,
        technical_specs,
        capacity,
        venue_type,
        members,
        formation_date,
        additional_profile_types
      `)
      .order("created_at", { ascending: false });

    // Obtener galerías de imágenes de cada perfil
    const { data: galleries } = await supabase
      .from("profile_galleries")
      .select("profile_id, url, media_type, title, description");

    // Obtener contenido subido (videos, audios)
    const { data: content } = await supabase
      .from("content_uploads")
      .select(`
        id,
        title,
        description,
        content_type,
        video_url,
        audio_url,
        thumbnail_url,
        uploader_id,
        tags,
        views_count,
        likes_count
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    // Obtener información de usuarios (nombres de usuario)
    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url");

    // Mapear user_id a username
    const userMap: Record<string, any> = {};
    userProfiles?.forEach((u: any) => {
      userMap[u.id] = u;
    });

    // Mapear galerías por profile_id
    const galleryMap: Record<string, any[]> = {};
    galleries?.forEach((g: any) => {
      if (!galleryMap[g.profile_id]) galleryMap[g.profile_id] = [];
      galleryMap[g.profile_id].push(g);
    });

    // Mapear contenido por uploader_id
    const contentMap: Record<string, any[]> = {};
    content?.forEach((c: any) => {
      if (!contentMap[c.uploader_id]) contentMap[c.uploader_id] = [];
      contentMap[c.uploader_id].push(c);
    });

    // Construir contexto detallado de cada perfil/artista
    let artistContext = "## 🎭 ARTISTAS Y PERFILES DE RED AKASHA\n\n";
    artistContext += "Esta es la información detallada de cada artista, venue y perfil registrado. Usa estos datos para responder preguntas, generar imágenes basadas en características reales, y recordar información de cada uno.\n\n";

    const venueProfiles: any[] = [];
    const artistProfiles: any[] = [];

    profiles?.forEach((p: any) => {
      const user = userMap[p.user_id];
      const gallery = galleryMap[p.id] || [];
      const userContent = contentMap[p.user_id] || [];
      
      // Clasificar por tipo
      if (p.profile_type === "sala_concierto" || p.profile_type === "venue") {
        venueProfiles.push({ ...p, user, gallery, content: userContent });
      } else {
        artistProfiles.push({ ...p, user, gallery, content: userContent });
      }
    });

    // Sección de Venues
    if (venueProfiles.length > 0) {
      artistContext += "### 🏛️ VENUES Y SALAS DE CONCIERTO\n\n";
      venueProfiles.forEach((v: any) => {
        artistContext += `**${v.display_name || "Sin nombre"}**\n`;
        artistContext += `- Tipo: ${v.venue_type || v.profile_type}\n`;
        artistContext += `- Ubicación: ${v.ciudad || ""}, ${v.provincia || ""}, ${v.pais || ""}\n`;
        if (v.capacity) artistContext += `- Capacidad: ${v.capacity} personas\n`;
        if (v.bio) artistContext += `- Descripción: ${v.bio}\n`;
        if (v.technical_specs) artistContext += `- Specs técnicos: ${v.technical_specs}\n`;
        if (v.avatar_url) artistContext += `- Imagen principal: ${v.avatar_url}\n`;
        if (v.gallery.length > 0) {
          artistContext += `- Galería de fotos (${v.gallery.length} imágenes): ${v.gallery.map((g: any) => g.url).join(", ")}\n`;
        }
        if (v.instagram) artistContext += `- Instagram: @${v.instagram}\n`;
        artistContext += "\n";
      });
    }

    // Sección de Artistas
    if (artistProfiles.length > 0) {
      artistContext += "### 🎵 ARTISTAS Y CREADORES\n\n";
      artistProfiles.forEach((a: any) => {
        const username = a.user?.username || "desconocido";
        artistContext += `**${a.display_name || username}** (@${username})\n`;
        artistContext += `- Tipo de perfil: ${a.profile_type}\n`;
        if (a.additional_profile_types?.length > 0) {
          artistContext += `- Roles adicionales: ${a.additional_profile_types.join(", ")}\n`;
        }
        artistContext += `- Ubicación: ${a.ciudad || ""}, ${a.provincia || ""}, ${a.pais || ""}\n`;
        if (a.genre) artistContext += `- Género musical: ${a.genre}\n`;
        if (a.bio) artistContext += `- Biografía: ${a.bio}\n`;
        if (a.members) artistContext += `- Miembros: ${a.members}\n`;
        if (a.formation_date) artistContext += `- Fecha de formación: ${a.formation_date}\n`;
        if (a.avatar_url) artistContext += `- Foto de perfil: ${a.avatar_url}\n`;
        if (a.gallery.length > 0) {
          artistContext += `- Galería de fotos (${a.gallery.length} imágenes): ${a.gallery.map((g: any) => g.url).join(", ")}\n`;
        }
        if (a.content.length > 0) {
          artistContext += `- Contenido subido (${a.content.length} items):\n`;
          a.content.forEach((c: any) => {
            artistContext += `  • "${c.title}" (${c.content_type}): ${c.views_count || 0} vistas\n`;
            if (c.video_url) artistContext += `    Video: ${c.video_url}\n`;
            if (c.audio_url) artistContext += `    Audio: ${c.audio_url}\n`;
            if (c.thumbnail_url) artistContext += `    Thumbnail: ${c.thumbnail_url}\n`;
          });
        }
        // Redes sociales
        const socials = [];
        if (a.instagram) socials.push(`Instagram: @${a.instagram}`);
        if (a.facebook) socials.push(`Facebook: ${a.facebook}`);
        if (a.linkedin) socials.push(`LinkedIn: ${a.linkedin}`);
        if (socials.length > 0) artistContext += `- Redes: ${socials.join(", ")}\n`;
        artistContext += "\n";
      });
    }

    return artistContext;
  } catch (error) {
    console.error("Error fetching artists context:", error);
    return "\n## Contexto de artistas no disponible.\n";
  }
}

// Función para obtener estadísticas de la plataforma
async function getPlatformStats(supabase: any): Promise<string> {
  try {
    // Estadísticas de usuarios
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Estadísticas de perfiles por tipo
    const { data: profilesByType } = await supabase
      .from("profile_details")
      .select("profile_type");
    
    const profileTypeCounts: Record<string, number> = {};
    profilesByType?.forEach((p: any) => {
      profileTypeCounts[p.profile_type] = (profileTypeCounts[p.profile_type] || 0) + 1;
    });

    // Estadísticas de contenido
    const { count: totalContent } = await supabase
      .from("content_uploads")
      .select("*", { count: "exact", head: true });

    const { count: approvedContent } = await supabase
      .from("content_uploads")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const { count: pendingContent } = await supabase
      .from("content_uploads")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Contenido por tipo
    const { data: contentByType } = await supabase
      .from("content_uploads")
      .select("content_type");
    
    const contentTypeCounts: Record<string, number> = {};
    contentByType?.forEach((c: any) => {
      contentTypeCounts[c.content_type] = (contentTypeCounts[c.content_type] || 0) + 1;
    });

    // Interacciones
    const { count: totalLikes } = await supabase
      .from("content_likes")
      .select("*", { count: "exact", head: true });

    const { count: totalComments } = await supabase
      .from("content_comments")
      .select("*", { count: "exact", head: true });

    const { count: totalShares } = await supabase
      .from("content_shares")
      .select("*", { count: "exact", head: true });

    // Foro
    const { count: totalThreads } = await supabase
      .from("forum_threads")
      .select("*", { count: "exact", head: true });

    const { count: totalPosts } = await supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true });

    // Playlists
    const { count: totalPlaylists } = await supabase
      .from("playlists")
      .select("*", { count: "exact", head: true });

    // Ventas/Compras
    const { data: purchases } = await supabase
      .from("content_purchases")
      .select("amount, status, created_at")
      .eq("status", "completed");

    const totalRevenue = purchases?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
    const totalPurchases = purchases?.length || 0;

    // Contenido más popular (top 5)
    const { data: topContent } = await supabase
      .from("content_uploads")
      .select("title, views_count, likes_count, content_type")
      .order("views_count", { ascending: false })
      .limit(5);

    // Hilos recientes del foro (últimos 10)
    const { data: recentThreads } = await supabase
      .from("forum_threads")
      .select("title, views_count, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Formatear estadísticas
    const profileTypeList = Object.entries(profileTypeCounts)
      .map(([type, count]) => `  - ${type}: ${count}`)
      .join("\n");

    const contentTypeList = Object.entries(contentTypeCounts)
      .map(([type, count]) => `  - ${type}: ${count}`)
      .join("\n");

    const topContentList = topContent?.map((c: any) => 
      `  - "${c.title}" (${c.content_type}): ${c.views_count || 0} vistas, ${c.likes_count || 0} likes`
    ).join("\n") || "  Sin datos";

    const recentThreadsList = recentThreads?.map((t: any) => 
      `  - "${t.title}": ${t.views_count || 0} vistas`
    ).join("\n") || "  Sin datos";

    return `
## 📊 ESTADÍSTICAS EN TIEMPO REAL DE LA PLATAFORMA

### Usuarios y Perfiles
- **Total de usuarios registrados**: ${totalUsers || 0}
- **Perfiles por tipo**:
${profileTypeList || "  Sin datos"}

### Contenido
- **Total de contenido subido**: ${totalContent || 0}
- **Contenido aprobado**: ${approvedContent || 0}
- **Contenido pendiente de revisión**: ${pendingContent || 0}
- **Por tipo de contenido**:
${contentTypeList || "  Sin datos"}

### Interacciones
- **Total de likes**: ${totalLikes || 0}
- **Total de comentarios**: ${totalComments || 0}
- **Total de shares**: ${totalShares || 0}

### Foro
- **Total de hilos**: ${totalThreads || 0}
- **Total de posts/respuestas**: ${totalPosts || 0}

### Playlists
- **Total de playlists creadas**: ${totalPlaylists || 0}

### Monetización
- **Total de compras completadas**: ${totalPurchases}
- **Ingresos totales**: $${totalRevenue.toFixed(2)} USD

### Top 5 Contenido Más Visto
${topContentList}

### Últimos 10 Hilos del Foro
${recentThreadsList}

---
`;
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return "\n## Estadísticas no disponibles en este momento.\n";
  }
}

// Helper function to verify authentication
async function verifyAuth(req: Request, supabase: any): Promise<{ userId: string; isAdmin: boolean } | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return null;
  }

  // Check if user is admin
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  return {
    userId: data.user.id,
    isAdmin: !!roleData,
  };
}

serve(async (req) => {
  console.log(`[${VERSION}] Request received at ${new Date().toISOString()}, deployed: ${DEPLOYED_AT}`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Crear cliente Supabase con service role para operaciones admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client for auth verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    
    // Verify authentication - REQUIRED for this endpoint
    const auth = await verifyAuth(req, authClient);
    
    if (!auth) {
      console.log(`[${VERSION}] Unauthorized request - no valid auth token`);
      return new Response(
        JSON.stringify({ error: "Autenticación requerida. Por favor inicia sesión." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${VERSION}] Authenticated user: ${auth.userId}, isAdmin: ${auth.isAdmin}`);

    // Create service client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { messages, includeForumContext, generateImplementation, includePlatformStats = true, includeArtistsContext = true } = await req.json();
    console.log(`[${VERSION}] Processing request - generateImplementation: ${generateImplementation}, includeArtistsContext: ${includeArtistsContext}`);

    // Obtener estadísticas de la plataforma
    let platformStats = "";
    if (includePlatformStats) {
      platformStats = await getPlatformStats(supabase);
    }

    // Obtener contexto completo de artistas y perfiles
    let artistsContext = "";
    if (includeArtistsContext) {
      artistsContext = await getArtistsAndProfilesContext(supabase);
    }

    let contextMessages = [{ role: "system", content: getSystemPrompt(platformStats + "\n" + artistsContext, auth.isAdmin) }];

    // Si se solicita, agregar contexto del foro
    if (includeForumContext) {
      // Obtener hilos recientes del foro
      const { data: recentThreads } = await supabase
        .from("forum_threads")
        .select("title, content, created_at, views_count")
        .order("created_at", { ascending: false })
        .limit(30);

      if (recentThreads && recentThreads.length > 0) {
        const forumSummary = recentThreads
          .map(t => `- "${t.title}" (${t.views_count || 0} vistas): ${t.content?.slice(0, 150)}...`)
          .join("\n");

        contextMessages.push({
          role: "system",
          content: `## Contexto Detallado del Foro (últimos 30 hilos):\n${forumSummary}\n\nAnaliza estos temas para identificar necesidades, quejas, sugerencias y patrones de la comunidad.`
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [...contextMessages, ...messages],
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

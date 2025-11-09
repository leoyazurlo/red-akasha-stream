import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, stats, badges, reputationPoints } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Create a detailed prompt for the achievement card
    const prompt = `Create a professional achievement card for ${userName} from Red Akasha community forum.

Design specifications:
- Modern, elegant design with a dark cosmic theme (deep space blues, purples, and cyans)
- Size: 1200x630px (optimal for social media sharing)
- Include Red Akasha logo/branding in top corner
- Central focus on user achievements

Content to include:
- User name: ${userName} in large, prominent font
- Reputation Points: ${reputationPoints} points with a trophy icon
- Forum Statistics:
  * ${stats.threads} Threads Created
  * ${stats.posts} Posts Written
  * ${stats.positiveVotes} Positive Votes Received
  * ${stats.bestAnswers} Best Answers
- Badge Summary: ${badges.bronze} Bronze, ${badges.silver} Silver, ${badges.gold} Gold, ${badges.special} Special, ${badges.merit} Merit badges
- Decorative elements: stars, cosmic particles, gradient overlays
- Professional typography with clear hierarchy
- Clean, shareable social media card aesthetic

Style: Modern, professional, cosmic/space theme, high quality, digital art`;

    console.log("Generating achievement card with Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      throw new Error(`Lovable AI request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Lovable AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error generating achievement card:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate achievement card";
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 500 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RejectionEmailRequest {
  email: string;
  nombre: string;
  motivo: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - email not sent");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. The rejection was saved but no email was sent." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, nombre, motivo }: RejectionEmailRequest = await req.json();

    if (!email || !nombre || !motivo) {
      throw new Error("Missing required fields: email, nombre, motivo");
    }

    // Use Resend REST API directly instead of npm package
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Red Akasha <noreply@redakasha.com>",
        to: [email],
        subject: "Actualización sobre tu solicitud de registro - Red Akasha",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: #00d4ff; margin: 0; font-size: 24px; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .reason-box { background: #fff; border-left: 4px solid #dc3545; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎵 Red Akasha</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${nombre}</strong>,</p>
                
                <p>Gracias por tu interés en unirte a Red Akasha. Hemos revisado tu solicitud de registro y lamentamos informarte que no ha sido aprobada en esta ocasión.</p>
                
                <div class="reason-box">
                  <strong>Motivo:</strong>
                  <p style="margin-bottom: 0;">${motivo}</p>
                </div>
                
                <p>Si consideras que esto es un error o deseas proporcionar información adicional, puedes volver a enviar tu solicitud o contactarnos directamente.</p>
                
                <p>Saludos cordiales,<br><strong>El equipo de Red Akasha</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Red Akasha. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();
    console.log("Rejection email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-rejection-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

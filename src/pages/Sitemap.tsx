import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://red-akasha-stream.lovable.app";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/on-demand", priority: "0.9", changefreq: "daily" },
  { path: "/live", priority: "0.9", changefreq: "hourly" },
  { path: "/circuito", priority: "0.7", changefreq: "weekly" },
  { path: "/artistas", priority: "0.8", changefreq: "daily" },
  { path: "/asociate", priority: "0.6", changefreq: "monthly" },
  { path: "/foro", priority: "0.7", changefreq: "daily" },
  { path: "/akasha-ia", priority: "0.6", changefreq: "weekly" },
  { path: "/suscripciones", priority: "0.5", changefreq: "monthly" },
  { path: "/contacto", priority: "0.4", changefreq: "monthly" },
  { path: "/proyecto-red-akasha", priority: "0.5", changefreq: "monthly" },
];

export default function Sitemap() {
  useEffect(() => {
    async function generateAndServe() {
      // Fetch dynamic data
      const [artistsRes, contentRes] = await Promise.all([
        supabase.from("artists").select("id, updated_at").limit(500),
        supabase
          .from("content_uploads")
          .select("id, updated_at")
          .eq("status", "approved")
          .limit(500),
      ]);

      const artists = artistsRes.data || [];
      const content = contentRes.data || [];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Static pages
      for (const page of STATIC_PAGES) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}${page.path}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
      }

      // Artist pages
      for (const artist of artists) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/artista/${artist.id}</loc>\n`;
        xml += `    <lastmod>${new Date(artist.updated_at || Date.now()).toISOString().split("T")[0]}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }

      // Content pages
      for (const item of content) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/video/${item.id}</loc>\n`;
        xml += `    <lastmod>${new Date(item.updated_at || Date.now()).toISOString().split("T")[0]}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      // Download as file for the user
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      a.click();
      URL.revokeObjectURL(url);
    }

    generateAndServe();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Generando Sitemap...</h1>
        <p className="text-muted-foreground">
          El archivo sitemap.xml se descargará automáticamente.
        </p>
      </div>
    </div>
  );
}

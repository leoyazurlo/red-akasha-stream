import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt"],
      manifest: {
        name: "Red Akasha",
        short_name: "Akasha",
        description: "Plataforma colaborativa de streaming para artistas",
        theme_color: "hsl(270, 70%, 55%)",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png" },
          { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 10 } },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
            handler: "NetworkFirst",
            options: { cacheName: "supabase-storage" },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  publicDir: "public",
}));

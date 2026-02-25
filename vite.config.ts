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
        navigateFallbackDenylist: [/^\/~oauth/, /^\/auth/],
        // Never cache auth or API responses (sensitive user data)
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 10 } },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
            handler: "NetworkFirst",
            options: { cacheName: "supabase-storage", expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 } },
          },
          {
            // Block auth & functions endpoints from being cached
            urlPattern: /^https:\/\/.*\.supabase\.co\/(auth|functions|rest)/,
            handler: "NetworkOnly",
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
      output: {
        manualChunks: {
          // Admin pages in their own chunk — not loaded until admin navigates there
          admin: [
            "./src/pages/Admin.tsx",
            "./src/pages/admin/Categories.tsx",
            "./src/pages/admin/Streams.tsx",
            "./src/pages/admin/VOD.tsx",
            "./src/pages/admin/Podcasts.tsx",
            "./src/pages/admin/Users.tsx",
            "./src/pages/admin/ContentModeration.tsx",
            "./src/pages/admin/RegistrationRequests.tsx",
            "./src/pages/admin/AuditLogs.tsx",
            "./src/pages/admin/ProgramSchedules.tsx",
            "./src/pages/admin/Badges.tsx",
            "./src/pages/admin/ShareAnalytics.tsx",
            "./src/pages/admin/YouTubeVideos.tsx",
            "./src/pages/admin/StreamConfig.tsx",
            "./src/pages/admin/PaymentSettings.tsx",
            "./src/pages/admin/SalesAnalytics.tsx",
            "./src/pages/admin/Communications.tsx",
            "./src/pages/admin/Administrators.tsx",
            "./src/pages/admin/IAManagement.tsx",
            "./src/pages/admin/PlatformSettings.tsx",
            "./src/pages/admin/UserPayouts.tsx",
            "./src/pages/admin/Reports.tsx",
            "./src/pages/admin/Analytics.tsx",
          ],
          // AI / IDE features in separate chunk
          "akasha-ia": [
            "./src/pages/AkashaIA.tsx",
          ],
          // Vendor: heavy libs
          "vendor-react": ["react", "react-dom"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
  publicDir: "public",
}));

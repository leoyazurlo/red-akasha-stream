import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MiniPlayerProvider } from "@/contexts/MiniPlayerContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { QueuePlayerProvider } from "@/contexts/QueuePlayerContext";
import { FloatingQueuePlayer } from "@/components/ondemand/FloatingQueuePlayer";
import { LiveStreamProvider } from "@/contexts/LiveStreamContext";
import { FloatingLivePlayer } from "@/components/FloatingLivePlayer";
import { GeoRestrictionGuard } from "@/components/GeoRestrictionGuard";
import { ProfileEditDraftProvider } from "@/contexts/ProfileEditDraftContext";
import { GlobalChatProvider } from "@/contexts/GlobalChatContext";
import { UnreadMessagesAlert } from "@/components/notifications/UnreadMessagesAlert";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { InstallPWABanner } from "@/components/install-pwa-banner";
import { OfflineBanner } from "@/components/offline-banner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LiveRegionProvider } from "@/components/ui/live-region";
import { SkipLink } from "@/components/ui/skip-link";

// Eager load: landing page
import Index from "./pages/Index";

// Lazy load: all other pages
const Forum = lazy(() => import("./pages/Forum"));
const Subforo = lazy(() => import("./pages/Subforo"));
const Thread = lazy(() => import("./pages/Thread"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminStreams = lazy(() => import("./pages/admin/Streams"));
const AdminVOD = lazy(() => import("./pages/admin/VOD"));
const AdminPodcasts = lazy(() => import("./pages/admin/Podcasts"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminContentModeration = lazy(() => import("./pages/admin/ContentModeration"));
const AdminRegistrationRequests = lazy(() => import("./pages/admin/RegistrationRequests"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminProgramSchedules = lazy(() => import("./pages/admin/ProgramSchedules"));
const AdminBadges = lazy(() => import("./pages/admin/Badges"));
const AdminShareAnalytics = lazy(() => import("./pages/admin/ShareAnalytics"));
const AdminYouTubeVideos = lazy(() => import("./pages/admin/YouTubeVideos"));
const AdminStreamConfig = lazy(() => import("./pages/admin/StreamConfig"));
const AdminPaymentSettings = lazy(() => import("./pages/admin/PaymentSettings"));
const AdminSalesAnalytics = lazy(() => import("./pages/admin/SalesAnalytics"));
const AdminCommunications = lazy(() => import("./pages/admin/Communications"));
const AdminAdministrators = lazy(() => import("./pages/admin/Administrators"));
const AdminIAManagement = lazy(() => import("./pages/admin/IAManagement"));
const AdminPlatformSettings = lazy(() => import("./pages/admin/PlatformSettings"));
const AdminUserPayouts = lazy(() => import("./pages/admin/UserPayouts"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const Asociate = lazy(() => import("./pages/Asociate"));
const Circuito = lazy(() => import("./pages/Circuito"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Auth = lazy(() => import("./pages/Auth"));
const UploadContent = lazy(() => import("./pages/UploadContent"));
const Artists = lazy(() => import("./pages/Artists"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const OnDemand = lazy(() => import("./pages/OnDemand"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));
const MiColeccion = lazy(() => import("./pages/MiColeccion"));
const MiPerfil = lazy(() => import("./pages/MiPerfil"));
const EditarPerfil = lazy(() => import("./pages/EditarPerfil"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const AkashaIA = lazy(() => import("./pages/AkashaIA"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const ProyectoRedAkasha = lazy(() => import("./pages/ProyectoRedAkasha"));
const Contacto = lazy(() => import("./pages/Contacto"));
const LiveMap = lazy(() => import("./pages/LiveMap"));
const Suscripciones = lazy(() => import("./pages/Suscripciones"));
const ArtistAnalytics = lazy(() => import("./pages/artist/ArtistAnalytics"));
const Sitemap = lazy(() => import("./pages/Sitemap"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/** Wrap a route element with an ErrorBoundary for the given context */
const withEB = (element: React.ReactNode, context?: string) => (
  <ErrorBoundary context={context}>{element}</ErrorBoundary>
);

/** Admin-only route: requires authentication + admin role */
const adminRoute = (element: React.ReactNode, context?: string) => (
  <ErrorBoundary context={context}>
    <ProtectedRoute roles={["admin"]}>{element}</ProtectedRoute>
  </ErrorBoundary>
);

/** Authenticated route: requires login, any role */
const authRoute = (element: React.ReactNode, context?: string) => (
  <ErrorBoundary context={context}>
    <ProtectedRoute>{element}</ProtectedRoute>
  </ErrorBoundary>
);

const AppShell = () => {
  return (
    <LiveRegionProvider>
    <LiveStreamProvider>
      <GeoRestrictionGuard>
        <ProfileEditDraftProvider>
          <GlobalChatProvider>
            <SkipLink />
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={withEB(<Index />)} />
              <Route path="/on-demand" element={withEB(<OnDemand />, "stream")} />
              <Route path="/mi-coleccion" element={authRoute(<MiColeccion />)} />
              <Route path="/mi-perfil" element={authRoute(<MiPerfil />)} />
              <Route path="/editar-perfil" element={authRoute(<EditarPerfil />)} />
              <Route path="/favoritos" element={authRoute(<Favorites />)} />
              <Route path="/playlists" element={authRoute(<Playlists />)} />
              <Route path="/playlist/:id" element={withEB(<PlaylistDetail />)} />
              <Route path="/video/:id" element={withEB(<VideoDetail />, "stream")} />
              <Route path="/foro" element={withEB(<Forum />)} />
              <Route path="/foro/subforo/:id" element={withEB(<Subforo />)} />
              <Route path="/foro/hilo/:id" element={withEB(<Thread />)} />
              <Route path="/asociate" element={withEB(<Asociate />)} />
              <Route path="/circuito" element={withEB(<Circuito />, "map")} />
              <Route path="/circuito/perfil/:id" element={withEB(<PublicProfile />, "artist")} />
              <Route path="/auth" element={withEB(<Auth />)} />
              <Route path="/unauthorized" element={withEB(<Unauthorized />)} />
              <Route path="/subir-contenido" element={authRoute(<UploadContent />)} />
              <Route path="/artistas" element={withEB(<Artists />, "artist")} />
              <Route path="/artistas/:id" element={withEB(<ArtistProfile />, "artist")} />
              <Route path="/perfil/:id" element={withEB(<UserProfile />)} />
              <Route path="/live" element={withEB(<LiveMap />, "map")} />
              <Route path="/admin" element={adminRoute(<Admin />)} />
              <Route path="/admin/categories" element={adminRoute(<AdminCategories />)} />
              <Route path="/admin/streams" element={adminRoute(<AdminStreams />, "stream")} />
              <Route path="/admin/vod" element={adminRoute(<AdminVOD />)} />
              <Route path="/admin/podcasts" element={adminRoute(<AdminPodcasts />)} />
              <Route path="/admin/users" element={adminRoute(<AdminUsers />)} />
              <Route path="/admin/administrators" element={adminRoute(<AdminAdministrators />)} />
              <Route path="/admin/communications" element={adminRoute(<AdminCommunications />)} />
              <Route path="/admin/content" element={adminRoute(<AdminContentModeration />)} />
              <Route path="/admin/requests" element={adminRoute(<AdminRegistrationRequests />)} />
              <Route path="/admin/audit-logs" element={adminRoute(<AdminAuditLogs />)} />
              <Route path="/admin/program-schedules" element={adminRoute(<AdminProgramSchedules />)} />
              <Route path="/admin/badges" element={adminRoute(<AdminBadges />)} />
              <Route path="/admin/share-analytics" element={adminRoute(<AdminShareAnalytics />)} />
              <Route path="/admin/youtube-videos" element={adminRoute(<AdminYouTubeVideos />)} />
              <Route path="/admin/stream-config" element={adminRoute(<AdminStreamConfig />, "stream")} />
              <Route path="/admin/payments" element={adminRoute(<AdminPaymentSettings />)} />
              <Route path="/admin/sales" element={adminRoute(<AdminSalesAnalytics />)} />
              <Route path="/admin/ia-management" element={adminRoute(<AdminIAManagement />)} />
              <Route path="/admin/platform-settings" element={adminRoute(<AdminPlatformSettings />)} />
              <Route path="/admin/payouts" element={adminRoute(<AdminUserPayouts />)} />
              <Route path="/admin/reports" element={adminRoute(<AdminReports />)} />
              <Route path="/admin/analytics" element={adminRoute(<AdminAnalytics />)} />
              <Route path="/akasha-ia" element={authRoute(<AkashaIA />, "studio")} />
              <Route path="/proyecto" element={withEB(<ProyectoRedAkasha />)} />
              <Route path="/contacto" element={withEB(<Contacto />)} />
              <Route path="/suscripciones" element={withEB(<Suscripciones />)} />
              <Route path="/artist/analytics" element={authRoute(<ArtistAnalytics />, "analytics")} />
              <Route path="/sitemap" element={withEB(<Sitemap />)} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ErrorBoundary context="stream">
              <MiniPlayer />
              <FloatingLivePlayer />
              <FloatingQueuePlayer />
            </ErrorBoundary>
            
            <UnreadMessagesAlert />
            <AnalyticsTracker />
            <InstallPWABanner />
            <OfflineBanner />
          </GlobalChatProvider>
        </ProfileEditDraftProvider>
      </GeoRestrictionGuard>
    </LiveStreamProvider>
    </LiveRegionProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <QueuePlayerProvider>
    <MiniPlayerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </MiniPlayerProvider>
    </QueuePlayerProvider>
  </QueryClientProvider>
);

export default App;

import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MiniPlayerProvider } from "@/contexts/MiniPlayerContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { LiveStreamProvider } from "@/contexts/LiveStreamContext";
import { FloatingLivePlayer } from "@/components/FloatingLivePlayer";
import { GeoRestrictionGuard } from "@/components/GeoRestrictionGuard";
import { ProfileEditDraftProvider } from "@/contexts/ProfileEditDraftContext";
import { GlobalChatProvider } from "@/contexts/GlobalChatContext";
import { UnreadMessagesAlert } from "@/components/notifications/UnreadMessagesAlert";
import { Loader2 } from "lucide-react";
import { DevPerformanceBadge } from "@/components/dev/DevPerformanceBadge";
import { ErrorBoundary } from "@/components/error-boundary";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

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
const AkashaIA = lazy(() => import("./pages/AkashaIA"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const ProyectoRedAkasha = lazy(() => import("./pages/ProyectoRedAkasha"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Suscripciones = lazy(() => import("./pages/Suscripciones"));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MiniPlayerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <BrowserRouter>
            <LiveStreamProvider>
              <GeoRestrictionGuard>
                <ProfileEditDraftProvider>
                  <GlobalChatProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                      <Route path="/" element={withEB(<Index />)} />
                      <Route path="/on-demand" element={withEB(<OnDemand />, "stream")} />
                      <Route path="/mi-coleccion" element={withEB(<MiColeccion />)} />
                      <Route path="/mi-perfil" element={withEB(<MiPerfil />)} />
                      <Route path="/editar-perfil" element={withEB(<EditarPerfil />)} />
                      <Route path="/favoritos" element={withEB(<Favorites />)} />
                      <Route path="/playlists" element={withEB(<Playlists />)} />
                      <Route path="/playlist/:id" element={withEB(<PlaylistDetail />)} />
                      <Route path="/video/:id" element={withEB(<VideoDetail />, "stream")} />
                      <Route path="/foro" element={withEB(<Forum />)} />
                      <Route path="/foro/subforo/:id" element={withEB(<Subforo />)} />
                      <Route path="/foro/hilo/:id" element={withEB(<Thread />)} />
                      <Route path="/asociate" element={withEB(<Asociate />)} />
                      <Route path="/circuito" element={withEB(<Circuito />, "map")} />
                      <Route path="/circuito/perfil/:id" element={withEB(<PublicProfile />, "artist")} />
                      <Route path="/auth" element={withEB(<Auth />)} />
                      <Route path="/subir-contenido" element={withEB(<UploadContent />)} />
                      <Route path="/artistas" element={withEB(<Artists />, "artist")} />
                      <Route path="/artistas/:id" element={withEB(<ArtistProfile />, "artist")} />
                      <Route path="/perfil/:id" element={withEB(<UserProfile />)} />
                      <Route path="/admin" element={withEB(<Admin />)} />
                      <Route path="/admin/categories" element={withEB(<AdminCategories />)} />
                      <Route path="/admin/streams" element={withEB(<AdminStreams />, "stream")} />
                      <Route path="/admin/vod" element={withEB(<AdminVOD />)} />
                      <Route path="/admin/podcasts" element={withEB(<AdminPodcasts />)} />
                      <Route path="/admin/users" element={withEB(<AdminUsers />)} />
                      <Route path="/admin/administrators" element={withEB(<AdminAdministrators />)} />
                      <Route path="/admin/communications" element={withEB(<AdminCommunications />)} />
                      <Route path="/admin/content" element={withEB(<AdminContentModeration />)} />
                      <Route path="/admin/requests" element={withEB(<AdminRegistrationRequests />)} />
                      <Route path="/admin/audit-logs" element={withEB(<AdminAuditLogs />)} />
                      <Route path="/admin/program-schedules" element={withEB(<AdminProgramSchedules />)} />
                      <Route path="/admin/badges" element={withEB(<AdminBadges />)} />
                      <Route path="/admin/share-analytics" element={withEB(<AdminShareAnalytics />)} />
                      <Route path="/admin/youtube-videos" element={withEB(<AdminYouTubeVideos />)} />
                      <Route path="/admin/stream-config" element={withEB(<AdminStreamConfig />, "stream")} />
                      <Route path="/admin/payments" element={withEB(<AdminPaymentSettings />)} />
                      <Route path="/admin/sales" element={withEB(<AdminSalesAnalytics />)} />
                      <Route path="/admin/ia-management" element={withEB(<AdminIAManagement />)} />
                      <Route path="/admin/platform-settings" element={withEB(<AdminPlatformSettings />)} />
                      <Route path="/admin/payouts" element={withEB(<AdminUserPayouts />)} />
                      <Route path="/admin/reports" element={withEB(<AdminReports />)} />
                      <Route path="/admin/analytics" element={withEB(<AdminAnalytics />)} />
                      <Route path="/akasha-ia" element={withEB(<AkashaIA />, "studio")} />
                      <Route path="/proyecto" element={withEB(<ProyectoRedAkasha />)} />
                      <Route path="/contacto" element={withEB(<Contacto />)} />
                      <Route path="/suscripciones" element={withEB(<Suscripciones />)} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    <ErrorBoundary context="stream">
                      <MiniPlayer />
                      <FloatingLivePlayer />
                    </ErrorBoundary>
                    <UnreadMessagesAlert />
                    <AnalyticsTracker />
                    {import.meta.env.DEV && <DevPerformanceBadge />}
                  </GlobalChatProvider>
                </ProfileEditDraftProvider>
              </GeoRestrictionGuard>
            </LiveStreamProvider>
          </BrowserRouter>
      </TooltipProvider>
    </MiniPlayerProvider>
  </QueryClientProvider>
);

export default App;

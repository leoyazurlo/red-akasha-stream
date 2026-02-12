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
                      <Route path="/" element={<Index />} />
                      <Route path="/on-demand" element={<OnDemand />} />
                      <Route path="/mi-coleccion" element={<MiColeccion />} />
                      <Route path="/mi-perfil" element={<MiPerfil />} />
                      <Route path="/editar-perfil" element={<EditarPerfil />} />
                      <Route path="/favoritos" element={<Favorites />} />
                      <Route path="/playlists" element={<Playlists />} />
                      <Route path="/playlist/:id" element={<PlaylistDetail />} />
                      <Route path="/video/:id" element={<VideoDetail />} />
                      <Route path="/foro" element={<Forum />} />
                      <Route path="/foro/subforo/:id" element={<Subforo />} />
                      <Route path="/foro/hilo/:id" element={<Thread />} />
                      <Route path="/asociate" element={<Asociate />} />
                      <Route path="/circuito" element={<Circuito />} />
                      <Route path="/circuito/perfil/:id" element={<PublicProfile />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/subir-contenido" element={<UploadContent />} />
                      <Route path="/artistas" element={<Artists />} />
                      <Route path="/artistas/:id" element={<ArtistProfile />} />
                      <Route path="/perfil/:id" element={<UserProfile />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/categories" element={<AdminCategories />} />
                      <Route path="/admin/streams" element={<AdminStreams />} />
                      <Route path="/admin/vod" element={<AdminVOD />} />
                      <Route path="/admin/podcasts" element={<AdminPodcasts />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/administrators" element={<AdminAdministrators />} />
                      <Route path="/admin/communications" element={<AdminCommunications />} />
                      <Route path="/admin/content" element={<AdminContentModeration />} />
                      <Route path="/admin/requests" element={<AdminRegistrationRequests />} />
                      <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                      <Route path="/admin/program-schedules" element={<AdminProgramSchedules />} />
                      <Route path="/admin/badges" element={<AdminBadges />} />
                      <Route path="/admin/share-analytics" element={<AdminShareAnalytics />} />
                      <Route path="/admin/youtube-videos" element={<AdminYouTubeVideos />} />
                      <Route path="/admin/stream-config" element={<AdminStreamConfig />} />
                      <Route path="/admin/payments" element={<AdminPaymentSettings />} />
                      <Route path="/admin/sales" element={<AdminSalesAnalytics />} />
                      <Route path="/admin/ia-management" element={<AdminIAManagement />} />
                      <Route path="/admin/platform-settings" element={<AdminPlatformSettings />} />
                      <Route path="/admin/payouts" element={<AdminUserPayouts />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                      <Route path="/akasha-ia" element={<AkashaIA />} />
                      <Route path="/proyecto" element={<ProyectoRedAkasha />} />
                      <Route path="/contacto" element={<Contacto />} />
                      <Route path="/suscripciones" element={<Suscripciones />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    <MiniPlayer />
                    <FloatingLivePlayer />
                    <UnreadMessagesAlert />
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

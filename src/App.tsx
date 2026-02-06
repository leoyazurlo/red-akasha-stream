import React from "react";
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
import Index from "./pages/Index";
import Forum from "./pages/Forum";
import Subforo from "./pages/Subforo";
import Thread from "./pages/Thread";
import Admin from "./pages/Admin";
import AdminCategories from "./pages/admin/Categories";
import AdminStreams from "./pages/admin/Streams";
import AdminVOD from "./pages/admin/VOD";
import AdminPodcasts from "./pages/admin/Podcasts";
import AdminUsers from "./pages/admin/Users";
import AdminContentModeration from "./pages/admin/ContentModeration";
import AdminRegistrationRequests from "./pages/admin/RegistrationRequests";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminProgramSchedules from "./pages/admin/ProgramSchedules";
import AdminBadges from "./pages/admin/Badges";
import AdminShareAnalytics from "./pages/admin/ShareAnalytics";
import AdminYouTubeVideos from "./pages/admin/YouTubeVideos";
import AdminStreamConfig from "./pages/admin/StreamConfig";
import AdminPaymentSettings from "./pages/admin/PaymentSettings";
import AdminSalesAnalytics from "./pages/admin/SalesAnalytics";
import AdminCommunications from "./pages/admin/Communications";
import AdminAdministrators from "./pages/admin/Administrators";
import AdminIAManagement from "./pages/admin/IAManagement";
import AdminPlatformSettings from "./pages/admin/PlatformSettings";
 import AdminUserPayouts from "./pages/admin/UserPayouts";
 import AdminReports from "./pages/admin/Reports";
import Asociate from "./pages/Asociate";
import Circuito from "./pages/Circuito";
import PublicProfile from "./pages/PublicProfile";
import Auth from "./pages/Auth";
import UploadContent from "./pages/UploadContent";
import Artists from "./pages/Artists";
import ArtistProfile from "./pages/ArtistProfile";
import UserProfile from "./pages/UserProfile";
import OnDemand from "./pages/OnDemand";
import Favorites from "./pages/Favorites";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import MiColeccion from "./pages/MiColeccion";
import MiPerfil from "./pages/MiPerfil";
import EditarPerfil from "./pages/EditarPerfil";
import NotFound from "./pages/NotFound";
import AkashaIA from "./pages/AkashaIA";

import VideoDetail from "./pages/VideoDetail";
import ProyectoRedAkasha from "./pages/ProyectoRedAkasha";
import Contacto from "./pages/Contacto";
import Suscripciones from "./pages/Suscripciones";

const queryClient = new QueryClient();

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
                    <MiniPlayer />
                    <FloatingLivePlayer />
                    <UnreadMessagesAlert />
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

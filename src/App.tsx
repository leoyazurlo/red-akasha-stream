import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Forum from "./pages/Forum";
import Subforo from "./pages/Subforo";
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
import Asociate from "./pages/Asociate";
import Circuito from "./pages/Circuito";
import Auth from "./pages/Auth";
import UploadContent from "./pages/UploadContent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/foro" element={<Forum />} />
          <Route path="/foro/subforo/:id" element={<Subforo />} />
          <Route path="/asociate" element={<Asociate />} />
          <Route path="/circuito" element={<Circuito />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/subir-contenido" element={<UploadContent />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/streams" element={<AdminStreams />} />
          <Route path="/admin/vod" element={<AdminVOD />} />
          <Route path="/admin/podcasts" element={<AdminPodcasts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/content" element={<AdminContentModeration />} />
          <Route path="/admin/requests" element={<AdminRegistrationRequests />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/program-schedules" element={<AdminProgramSchedules />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

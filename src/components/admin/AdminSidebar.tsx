 import { LayoutDashboard, FolderTree, Users, Flag, ShieldAlert, Award, Radio, Film, Headphones, Calendar, FileText, UserCheck, ScrollText, Share2, Settings, CreditCard, TrendingUp, Mail, Shield, Bot, Cog, Banknote, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
 import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
 } from "@/components/ui/collapsible";
 import { useState } from "react";

const generalItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Usuarios", url: "/admin/users", icon: Users },
  { title: "Administradores", url: "/admin/administrators", icon: Shield },
  { title: "Comunicación", url: "/admin/communications", icon: Mail },
  { title: "Solicitudes", url: "/admin/requests", icon: UserCheck },
  { title: "Curaduría", url: "/admin/content", icon: FileText },
  { title: "Auditoría", url: "/admin/audit-logs", icon: ScrollText },
  { title: "Akasha IA", url: "/admin/ia-management", icon: Bot },
  { title: "Configuración", url: "/admin/platform-settings", icon: Cog },
];

 const paymentItems = [
   { title: "Configuración", url: "/admin/payments", icon: CreditCard },
   { title: "Payouts", url: "/admin/payouts", icon: Banknote },
   { title: "Ventas", url: "/admin/sales", icon: TrendingUp },
 ];
 
const streamingItems = [
  { title: "Streams en Vivo", url: "/admin/streams", icon: Radio },
  { title: "Config. Streaming", url: "/admin/stream-config", icon: Settings },
  { title: "Videos (VOD)", url: "/admin/vod", icon: Film },
  { title: "Podcasts", url: "/admin/podcasts", icon: Headphones },
  { title: "Horarios", url: "/admin/program-schedules", icon: Calendar },
  { title: "Videos YouTube", url: "/admin/youtube-videos", icon: Film },
  { title: "Estadísticas Shares", url: "/admin/share-analytics", icon: Share2 },
];

const forumItems = [
  { title: "Categorías", url: "/admin/categories", icon: FolderTree },
  { title: "Reportes", url: "/admin/reports", icon: Flag },
  { title: "Sanciones", url: "/admin/sanctions", icon: ShieldAlert },
  { title: "Badges", url: "/admin/badges", icon: Award },
];

export function AdminSidebar() {
  const { open } = useSidebar();
   const location = useLocation();
   const [paymentOpen, setPaymentOpen] = useState(
     paymentItems.some(item => location.pathname === item.url)
   );

  return (
    <Sidebar className={!open ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-cyan-400/70 text-xs uppercase tracking-wider">General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400 font-medium drop-shadow-[0_0_8px_hsl(180,100%,50%)]"
                          : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-500/10 hover:drop-shadow-[0_0_6px_hsl(180,100%,50%)] transition-all duration-200"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
           <SidebarGroupLabel className="text-cyan-400/70 text-xs uppercase tracking-wider">Finanzas</SidebarGroupLabel>
           <SidebarGroupContent>
             <SidebarMenu>
               <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen}>
                 <SidebarMenuItem>
                   <CollapsibleTrigger asChild>
                     <SidebarMenuButton className="w-full justify-between text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-500/10 hover:drop-shadow-[0_0_6px_hsl(180,100%,50%)] transition-all duration-200">
                       <div className="flex items-center gap-2">
                         <CreditCard className="h-4 w-4" />
                         {open && <span>Pagos</span>}
                       </div>
                       {open && (
                         <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${paymentOpen ? 'rotate-180' : ''}`} />
                       )}
                     </SidebarMenuButton>
                   </CollapsibleTrigger>
                   <CollapsibleContent>
                     <SidebarMenu className="pl-4 mt-1">
                       {paymentItems.map((item) => (
                         <SidebarMenuItem key={item.title}>
                           <SidebarMenuButton asChild>
                             <NavLink
                               to={item.url}
                               end
                               className={({ isActive }) =>
                                 isActive
                                   ? "bg-cyan-500/10 text-cyan-400 font-medium drop-shadow-[0_0_8px_hsl(180,100%,50%)]"
                                   : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-500/10 hover:drop-shadow-[0_0_6px_hsl(180,100%,50%)] transition-all duration-200"
                               }
                             >
                               <item.icon className="h-4 w-4" />
                               {open && <span>{item.title}</span>}
                             </NavLink>
                           </SidebarMenuButton>
                         </SidebarMenuItem>
                       ))}
                     </SidebarMenu>
                   </CollapsibleContent>
                 </SidebarMenuItem>
               </Collapsible>
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>
 
         <SidebarGroup>
          <SidebarGroupLabel className="text-cyan-400/70 text-xs uppercase tracking-wider">Streaming</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {streamingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400 font-medium drop-shadow-[0_0_8px_hsl(180,100%,50%)]"
                          : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-500/10 hover:drop-shadow-[0_0_6px_hsl(180,100%,50%)] transition-all duration-200"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-cyan-400/70 text-xs uppercase tracking-wider">Foro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {forumItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400 font-medium drop-shadow-[0_0_8px_hsl(180,100%,50%)]"
                          : "text-cyan-300/80 hover:text-cyan-300 hover:bg-cyan-500/10 hover:drop-shadow-[0_0_6px_hsl(180,100%,50%)] transition-all duration-200"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

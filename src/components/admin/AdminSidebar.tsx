import { LayoutDashboard, FolderTree, Users, Flag, ShieldAlert, Award, Radio, Film, Headphones, Calendar, FileText, UserCheck, ScrollText, Share2 } from "lucide-react";
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

const generalItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Usuarios", url: "/admin/users", icon: Users },
  { title: "Solicitudes", url: "/admin/requests", icon: UserCheck },
  { title: "Curaduría", url: "/admin/content", icon: FileText },
  { title: "Auditoría", url: "/admin/audit-logs", icon: ScrollText },
];

const streamingItems = [
  { title: "Streams en Vivo", url: "/admin/streams", icon: Radio },
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

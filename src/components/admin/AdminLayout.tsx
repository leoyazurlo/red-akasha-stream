import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Heart, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAkasha from "@/assets/logo-akasha-cyan.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), href: "/" },
    { name: t('nav.artists'), href: "/artistas" },
    { name: t('nav.circuit'), href: "/circuito" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('auth.sessionClosed'),
      description: t('auth.sessionClosedDesc'),
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Navigation items */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="hidden md:block px-4 py-2 text-sm font-light transition-colors rounded-lg hover:bg-secondary text-foreground hover:text-primary"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Center: Logo clickable to home */}
            <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src={logoAkasha} 
                alt="Logo Akasha" 
                className="h-8 w-8 sm:h-10 sm:w-10"
                style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(100%) saturate(2500%) hue-rotate(160deg) brightness(120%) contrast(110%)' }}
              />
              <span className="text-base sm:text-lg font-light tracking-wider text-foreground">
                Red Akasha - <span className="text-primary">Administración</span>
              </span>
            </Link>

            {/* Right: User controls */}
            <div className="flex items-center space-x-1">
              <LanguageSelector />
              
              {user && (
                <>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <User className="h-5 w-5 text-cyan-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50 bg-popover">
                      <DropdownMenuItem onSelect={() => navigate(`/perfil/${user.id}`)} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t('auth.profile')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate("/favoritos")} className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        {t('auth.favorites')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate("/playlists")} className="cursor-pointer">
                        <List className="mr-2 h-4 w-4" />
                        {t('auth.playlists')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('auth.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Content */}
      <SidebarProvider>
        <div className="flex w-full min-h-screen pt-16">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-4">
              <SidebarTrigger />
            </div>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

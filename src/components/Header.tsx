import { LogOut, User, Heart, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), href: "/" },
    { name: t('nav.onDemand'), href: "/on-demand" },
    { name: t('nav.artists'), href: "/artistas" },
    { name: t('nav.circuit'), href: "/circuito" },
    { name: t('nav.join'), href: "/asociate" },
    { name: t('nav.upload'), href: "/subir-contenido" },
    { name: t('nav.forum'), href: "/foro" },
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-lg sm:text-xl md:text-2xl font-light tracking-wider bg-gradient-primary bg-clip-text text-transparent">
              RED AKASHA
            </span>
            <img 
              src={logoAkasha} 
              alt="Logo Akasha" 
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12"
              style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(100%) saturate(2500%) hue-rotate(160deg) brightness(120%) contrast(110%)' }}
            />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`hidden md:block px-4 py-2 text-sm font-light transition-colors rounded-lg hover:bg-secondary ${
                    isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Language Selector */}
            <LanguageSelector />

            {/* Auth Section */}
            {user ? (
              <>
            <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <User className="h-5 w-5" />
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
                    {isAdmin && (
                      <DropdownMenuItem onSelect={() => navigate("/admin")} className="cursor-pointer">
                        {t('auth.controlPanel')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('auth.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="ml-2"
                onClick={() => navigate("/auth")}
              >
                {t('auth.login')}
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

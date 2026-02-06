import { LogOut, User, Library, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoAkasha from "@/assets/logo-akasha-cyan.png";
import logoRedAkasha from "@/assets/logo-red-akasha-header.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MessageBell } from "@/components/notifications/MessageBell";
import { LanguageSelector } from "@/components/LanguageSelector";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: t('nav.home'), href: "/" },
    { name: t('nav.onDemand'), href: "/on-demand" },
    { name: t('nav.artists'), href: "/artistas" },
    { name: t('nav.circuit'), href: "/circuito" },
    { name: t('nav.join'), href: "/asociate" },
    { name: t('nav.upload'), href: "/subir-contenido" },
    { name: t('nav.forum'), href: "/foro" },
    { name: "Akasha IA", href: "/akasha-ia" },
    { name: "Suscripción", href: "/suscripciones" },
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
            <img 
              src={logoRedAkasha} 
              alt="Red Akasha" 
              className="h-10 sm:h-12 md:h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 text-sm font-light transition-colors rounded-lg hover:bg-secondary ${
                    isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-1">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Auth Section */}
            {user ? (
              <>
                <MessageBell />
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <User className="h-5 w-5 text-cyan-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-popover">
                    <DropdownMenuItem asChild className="cursor-pointer hover:!bg-cyan-500/20 hover:!text-cyan-400 focus:!bg-cyan-500/20 focus:!text-cyan-400 transition-all duration-200">
                      <Link to="/mi-perfil" className="flex items-center w-full hover:text-cyan-400">
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:!bg-cyan-500/20 hover:!text-cyan-400 focus:!bg-cyan-500/20 focus:!text-cyan-400 transition-all duration-200">
                      <Link to="/mi-coleccion" className="flex items-center w-full hover:text-cyan-400">
                        <Library className="mr-2 h-4 w-4" />
                        {t('auth.myCollection') || 'Mi Colección'}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer hover:!bg-cyan-500/20 hover:!text-cyan-400 focus:!bg-cyan-500/20 focus:!text-cyan-400 transition-all duration-200">
                        <Link to="/admin" className="flex items-center w-full hover:text-cyan-400">
                          {t('auth.controlPanel')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer hover:!bg-cyan-500/20 hover:!text-cyan-400 focus:!bg-cyan-500/20 focus:!text-cyan-400 transition-all duration-200">
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

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-2 h-12 w-12">
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background border-border p-0">
                <div className="flex flex-col h-full">
                  {/* Header del menú móvil */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="text-lg font-light tracking-wider bg-gradient-primary bg-clip-text text-transparent">
                      MENÚ
                    </span>
                  </div>
                  
                  {/* Navigation Links */}
                  <nav className="flex-1 overflow-y-auto py-4">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            to={item.href}
                            className={`block px-6 py-3 text-base font-light transition-colors border-l-2 ${
                              isActive 
                                ? 'text-primary border-primary bg-primary/10' 
                                : 'text-foreground border-transparent hover:text-primary hover:border-primary/50 hover:bg-secondary'
                            }`}
                          >
                            {item.name}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
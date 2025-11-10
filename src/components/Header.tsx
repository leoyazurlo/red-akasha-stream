import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const navItems = [
  { name: "Home", href: "/", isRoute: true },
  { name: "On Demand", href: "/on-demand", isRoute: true },
  { name: "Contenido", href: "/contenido", isRoute: true },
  { name: "Artistas", href: "/artistas", isRoute: true },
  { name: "Circuito", href: "/circuito", isRoute: true },
  { name: "Asociate", href: "/asociate", isRoute: true },
  { name: "Subir Contenido", href: "/subir-contenido", isRoute: true },
  { name: "Foro", href: "/foro", isRoute: true },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Responsive sizes */}
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = item.isRoute && location.pathname === item.href;
              return item.isRoute ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 text-sm font-light transition-colors rounded-lg hover:bg-secondary ${
                    isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="px-4 py-2 text-sm font-light text-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
                >
                  {item.name}
                </a>
              );
            })}

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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/perfil/${user.id}`)}>
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      Panel de Control
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      toast({
                        title: "Sesión cerrada",
                        description: "Has cerrado sesión correctamente.",
                      });
                      navigate("/");
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
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
                Iniciar Sesión
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button - Larger for better touch */}
          <Button
            variant="ghost"
            size="lg"
            className="md:hidden h-12 w-12 p-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-8 w-8" />
            ) : (
              <Menu className="h-8 w-8" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation - Larger touch targets */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-1 animate-slide-in">
            {navItems.map((item) => {
              const isActive = item.isRoute && location.pathname === item.href;
              return item.isRoute ? (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-light transition-colors rounded-lg hover:bg-secondary ${
                    isActive ? 'text-primary bg-secondary/50' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-light text-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
                >
                  {item.name}
                </a>
              );
            })}
            
            {/* Mobile Auth Section - Larger buttons */}
            <div className="pt-2 space-y-2 border-t border-border/50 mt-2">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/perfil/${user.id}`);
                    }}
                  >
                    <User className="mr-2 h-5 w-5" />
                    Mi Perfil
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 text-base"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/admin");
                      }}
                    >
                      Panel de Control
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      toast({
                        title: "Sesión cerrada",
                        description: "Has cerrado sesión correctamente.",
                      });
                      setMobileMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  className="w-full h-12 text-base"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/auth");
                  }}
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

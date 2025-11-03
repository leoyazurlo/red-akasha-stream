import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAkasha from "@/assets/logo-akasha-cyan.png";

const navItems = [
  { name: "Home", href: "#home" },
  { name: "On Demand", href: "#on-demand" },
  { name: "Artistas", href: "#artistas" },
  { name: "Circuito", href: "#circuito" },
  { name: "Asociate", href: "#asociate" },
  { name: "Subir Contenido", href: "#subir-contenido" },
  { name: "Foro", href: "#foro" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center space-x-3">
            <span className="text-2xl font-light tracking-wider bg-gradient-primary bg-clip-text text-transparent">
              RED AKASHA
            </span>
            <img 
              src={logoAkasha} 
              alt="Logo Akasha" 
              className="h-12 w-12"
              style={{ filter: 'brightness(0) saturate(100%) invert(70%) sepia(100%) saturate(2500%) hue-rotate(160deg) brightness(120%) contrast(110%)' }}
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm font-light text-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 animate-slide-in">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-light text-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
              >
                {item.name}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

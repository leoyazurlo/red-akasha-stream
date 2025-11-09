import { Music, Vote, UserPlus, Palette, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const footerActions = [
  {
    icon: Music,
    label: "Música en Vivo",
    href: "#musica-vivo",
  },
  {
    icon: Vote,
    label: "Votar",
    href: "#votar",
  },
  {
    icon: UserPlus,
    label: "Inscribirse",
    href: "#inscribirse",
  },
  {
    icon: Palette,
    label: "Artistas",
    href: "/artistas",
  },
  {
    icon: Share2,
    label: "Compartir Proyectos",
    href: "#compartir",
  },
];

export const Footer = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  return (
    <footer 
      ref={elementRef}
      className={`border-t border-border bg-card mt-16 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Action Buttons - Better mobile layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-8 md:mb-12">
          {footerActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                data-index={index}
                className={`group transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: isVisible ? `${index * 100}ms` : '0ms'
                }}
              >
                <div className="flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-secondary rounded-xl border border-border hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300 group-hover:animate-float">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <span className="text-xs md:text-sm font-light text-center text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-light tracking-wider bg-gradient-primary bg-clip-text text-transparent mb-2">
                RED AKASHA
              </h3>
              <p className="text-sm font-light text-muted-foreground">
                Plataforma colaborativa para artistas y productores
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm font-light text-muted-foreground">
                © 2024 Red Akasha. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

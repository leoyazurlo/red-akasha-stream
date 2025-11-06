import { Music, Vote, UserPlus, Palette, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {footerActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="group"
              >
                <div className="flex flex-col items-center gap-3 p-6 bg-secondary rounded-xl border border-border hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300 group-hover:animate-float">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-light text-center text-foreground group-hover:text-primary transition-colors">
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

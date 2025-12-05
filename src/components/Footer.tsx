import { Vote, UserPlus, Palette, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const Footer = () => {
  const { t } = useTranslation();
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const footerActions = [
    {
      icon: Vote,
      labelKey: "footer.contact",
      href: "#contacto",
    },
    {
      icon: UserPlus,
      labelKey: "footer.joinFree",
      href: "/asociate",
    },
    {
      icon: Palette,
      labelKey: "footer.project",
      href: "/proyecto",
    },
    {
      icon: Share2,
      labelKey: "footer.share",
      href: "#compartir",
    },
  ];
  
  return (
    <footer 
      ref={elementRef}
      className={`border-t border-border bg-card mt-16 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Action Buttons - Better mobile layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-8 md:mb-12">
          {footerActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={action.labelKey}
                href={action.href}
                data-index={index}
                className={`group transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: isVisible ? `${index * 100}ms` : '0ms'
                }}
              >
                <div className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-secondary rounded-lg border border-border hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300 group-hover:animate-float">
                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  </div>
                  <span className="text-[10px] md:text-xs font-light text-center text-foreground group-hover:text-primary transition-colors leading-tight">
                    {t(action.labelKey)}
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
                {t('footer.tagline')}
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm font-light text-muted-foreground">
                {t('footer.rights')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
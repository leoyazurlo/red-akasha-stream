import { useState } from "react";
import { Vote, UserPlus, Palette, Share2, Facebook, Twitter, Linkedin, Mail, MessageCircle, Copy, Check, Youtube, Instagram, Music2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import logoRedAkasha from "@/assets/logo-red-akasha-footer.png";
import logoOpenSource from "@/assets/logo-open-source.png";

export const Footer = () => {
  const { t } = useTranslation();
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pageTitle = typeof document !== 'undefined' ? document.title : 'Red Akasha';

  const shareOptions = [
    {
      icon: Facebook,
      label: "Facebook",
      color: "hover:text-blue-500",
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank', 'width=600,height=400');
      }
    },
    {
      icon: Twitter,
      label: "X (Twitter)",
      color: "hover:text-sky-400",
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}`, '_blank', 'width=600,height=400');
      }
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      color: "hover:text-blue-600",
      onClick: () => {
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(pageTitle)}`, '_blank', 'width=600,height=400');
      }
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      color: "hover:text-green-500",
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(pageTitle + ' ' + currentUrl)}`, '_blank');
      }
    },
    {
      icon: Mail,
      label: "Email",
      color: "hover:text-orange-400",
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(pageTitle)}&body=${encodeURIComponent('Mira esto: ' + currentUrl)}`;
      }
    },
    {
      icon: copied ? Check : Copy,
      label: copied ? "¡Copiado!" : "Copiar enlace",
      color: copied ? "text-green-500" : "hover:text-cyan-400",
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(currentUrl);
          setCopied(true);
          toast({
            title: "Enlace copiado",
            description: "El enlace ha sido copiado al portapapeles",
          });
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          toast({
            title: "Error",
            description: "No se pudo copiar el enlace",
            variant: "destructive",
          });
        }
      }
    },
  ];

  const footerActions = [
    {
      icon: Vote,
      labelKey: "footer.contact",
      href: "/contacto",
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
                <div className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-secondary rounded-lg border border-cyan-400 shadow-[0_0_25px_hsl(180_100%_50%/0.4),0_0_50px_hsl(180_100%_50%/0.2)] hover:shadow-[0_0_35px_hsl(180_100%_50%/0.6),0_0_70px_hsl(180_100%_50%/0.3)] hover:scale-105 transition-all duration-300">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-cyan-400/30 transition-all duration-300 group-hover:animate-float">
                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-[10px] md:text-xs font-light text-center text-foreground group-hover:text-cyan-400 transition-colors leading-tight">
                    {t(action.labelKey)}
                  </span>
                </div>
              </a>
            );
          })}

          {/* Share Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`group transition-all duration-500 w-full ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: isVisible ? `${3 * 100}ms` : '0ms'
                }}
              >
                <div className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-secondary rounded-lg border border-cyan-400 shadow-[0_0_25px_hsl(180_100%_50%/0.4),0_0_50px_hsl(180_100%_50%/0.2)] hover:shadow-[0_0_35px_hsl(180_100%_50%/0.6),0_0_70px_hsl(180_100%_50%/0.3)] hover:scale-105 transition-all duration-300">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-cyan-400/30 transition-all duration-300 group-hover:animate-float">
                    <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-[10px] md:text-xs font-light text-center text-foreground group-hover:text-cyan-400 transition-colors leading-tight">
                    {t('footer.share')}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-card border-border z-50"
              sideOffset={8}
            >
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={option.onClick}
                    className={`flex items-center gap-3 cursor-pointer ${option.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer Info with Logos and Social */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col gap-8">
            {/* Top row: Logos and Social */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logos */}
              <div className="flex items-center gap-6">
                <img 
                  src={logoRedAkasha} 
                  alt="Red Akasha" 
                  className="h-10 md:h-12 object-contain"
                />
                <div className="w-px h-8 bg-border" />
                <img 
                  src={logoOpenSource} 
                  alt="Open Source" 
                  className="h-8 md:h-10 object-contain"
                />
              </div>

              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                <a
                  href="https://youtube.com/@redakasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2.5 rounded-full bg-secondary/80 border border-border hover:border-red-500 hover:bg-red-500/10 transition-all duration-300"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </a>
                <a
                  href="https://open.spotify.com/user/redakasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2.5 rounded-full bg-secondary/80 border border-border hover:border-green-500 hover:bg-green-500/10 transition-all duration-300"
                  aria-label="Spotify"
                >
                  <Music2 className="w-5 h-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
                </a>
                <a
                  href="https://instagram.com/redakasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2.5 rounded-full bg-secondary/80 border border-border hover:border-pink-500 hover:bg-pink-500/10 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                </a>
                <a
                  href="https://facebook.com/redakasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2.5 rounded-full bg-secondary/80 border border-border hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </a>
                <a
                  href="https://tiktok.com/@redakasha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2.5 rounded-full bg-secondary/80 border border-border hover:border-foreground hover:bg-foreground/10 transition-all duration-300"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Bottom row: Tagline and Rights */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
              <p className="text-sm font-light text-muted-foreground">
                {t('footer.tagline')}
              </p>
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

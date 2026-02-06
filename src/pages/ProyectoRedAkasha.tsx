import { Users, Music, Vote, Building2, Heart, MessageSquare, Sparkles, Target, HandHeart, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoAkasha from "@/assets/logo-akasha-cyan.png";

const ProyectoRedAkasha = () => {
  const { elementRef: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { elementRef: contentRef, isVisible: contentVisible } = useScrollAnimation();

  const highlights = [
    { icon: Users, text: "Comunidad colaborativa y transparente" },
    { icon: Vote, text: "Voz y voto para cada miembro" },
    { icon: MessageSquare, text: "Foros creados por la comunidad" },
    { icon: Sparkles, text: "Tecnología blockchain" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      
      {/* Hero Section - INTACTO */}
      <section 
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center justify-center"
      >
        {/* Animated Background - Purple Theme */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-background to-purple-800/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        <div 
          className={`container mx-auto px-4 text-center relative z-10 transition-all duration-1000 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Logo Cyan */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/60 blur-3xl rounded-full scale-150" />
              <div className="absolute inset-0 bg-cyan-300/40 blur-2xl rounded-full scale-125" />
              <img 
                src={logoAkasha} 
                alt="Red Akasha" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-[0_0_40px_rgba(0,255,255,0.7)] brightness-110"
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
              Red Akasha
            </span>
            <span className="text-primary">.org</span>
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto mb-8 font-light">
            Una voz colectiva para la{" "}
            <span className="text-primary font-medium">música</span> y el{" "}
            <span className="text-primary font-medium">arte emergente</span>
          </p>

          <Link to="/asociate">
            <Button size="lg" className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90">
              Únete al Movimiento
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Contenido Simplificado */}
      <section 
        ref={contentRef}
        className="py-16 md:py-24"
      >
        <div 
          className={`container mx-auto px-4 max-w-4xl transition-all duration-1000 ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Texto Principal Unificado */}
          <div className="space-y-6 text-lg md:text-xl text-foreground/85 leading-relaxed mb-12">
            <p>
              En un mundo donde el talento queda silenciado por la falta de oportunidades, 
              <span className="text-primary font-semibold"> Red Akasha</span> nace como un espacio 
              <span className="text-primary"> libre, abierto y colaborativo</span>.
            </p>
            
            <p>
              Una plataforma digital de contenidos audiovisuales que une a <span className="font-medium text-foreground">músicos</span>, <span className="font-medium text-foreground">productores</span>, <span className="font-medium text-foreground">estudios</span>, <span className="font-medium text-foreground">teatros</span> y <span className="font-medium text-foreground">venues</span> en 
              torno a un mismo sueño: dar voz y voto a los artistas emergentes.
            </p>

            <p className="text-muted-foreground">
              No se trata solo de escuchar música: se trata de participar en la creación de una nueva 
              industria cultural, donde el valor del contenido se mide por el aporte de la comunidad.
            </p>
          </div>

          {/* Highlights en línea */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-foreground/80"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Quiénes se benefician */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: Music, label: "Músicos" },
              { icon: Building2, label: "Productores" },
              { icon: Target, label: "Venues" },
              { icon: Heart, label: "Amantes del arte" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* CTA Final */}
          <div className="text-center border-t border-border pt-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HandHeart className="w-6 h-6 text-primary" />
              <p className="text-2xl font-semibold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                Sumate, asociate, colaborá.
              </p>
            </div>
            <p className="text-muted-foreground mb-6">
              La industria que soñamos empieza aquí, y empieza con vos.
            </p>
            
            <Link to="/asociate">
              <Button size="lg" className="group bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90">
                Asociate Gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProyectoRedAkasha;

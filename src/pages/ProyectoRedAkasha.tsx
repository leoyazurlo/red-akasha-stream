import { Users, Music, Vote, Building2, Heart, MessageSquare, Sparkles, Target, HandHeart, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoAkasha from "@/assets/logo-akasha-cyan.png";

const ProyectoRedAkasha = () => {
  const { elementRef: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { elementRef: missionRef, isVisible: missionVisible } = useScrollAnimation();
  const { elementRef: featuresRef, isVisible: featuresVisible } = useScrollAnimation();
  const { elementRef: audienceRef, isVisible: audienceVisible } = useScrollAnimation();
  const { elementRef: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  const features = [
    {
      icon: Users,
      title: "Comunidad Colaborativa",
      description: "Asociate de manera gratuita y convertite en parte activa de una comunidad transparente"
    },
    {
      icon: Vote,
      title: "Voz y Voto",
      description: "El valor del contenido se mide por el aporte de la comunidad y el consenso colectivo"
    },
    {
      icon: MessageSquare,
      title: "Foros Activos",
      description: "Espacios de discusión creados y alimentados por la misma comunidad"
    },
    {
      icon: Sparkles,
      title: "Blockchain",
      description: "Transparencia y seguridad respaldadas por tecnología blockchain"
    }
  ];

  const audience = [
    { icon: Music, text: "Músicos que buscan ser escuchados", color: "from-cyan-500 to-blue-500" },
    { icon: Building2, text: "Productores y estudios que desean colaborar con nuevos talentos", color: "from-purple-500 to-pink-500" },
    { icon: Target, text: "Teatros y venues que quieren abrir sus puertas a propuestas frescas", color: "from-orange-500 to-red-500" },
    { icon: Heart, text: "Consumidores de buen contenido que valoran el arte auténtico", color: "from-green-500 to-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      
      {/* Hero Section - Full Screen */}
      <section 
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center justify-center"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-cyan-900/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
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
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 blur-3xl rounded-full scale-150" />
              <img 
                src={logoAkasha} 
                alt="Red Akasha" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]"
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

      {/* Mission Section */}
      <section 
        ref={missionRef}
        className="py-20 md:py-32 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
        <div 
          className={`container mx-auto px-4 relative transition-all duration-1000 ${
            missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-5xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/60 via-primary/40 to-cyan-500/60 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500" />
              <div className="relative p-8 md:p-12 bg-card/80 backdrop-blur-sm rounded-3xl border border-cyan-500/30">
                <div className="space-y-8 text-center">
                  <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                    En un mundo donde demasiadas veces el talento queda silenciado por la falta de oportunidades, 
                    <span className="text-primary font-semibold"> Red Akasha</span> nace como un espacio libre, abierto y colaborativo.
                  </p>
                  
                  <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                    Una plataforma digital de contenidos audiovisuales que une a músicos, productores, estudios, teatros 
                    y venues en torno a un mismo sueño: <span className="text-primary font-semibold">dar voz y voto a los artistas emergentes.</span>
                  </p>
                  
                  <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                    No se trata solo de escuchar música: se trata de{" "}
                    <span className="text-primary font-semibold">participar en la creación de una nueva industria cultural</span>, 
                    donde el valor del contenido se mide por el aporte de la comunidad y el apoyo de quienes 
                    creen en un futuro más justo y colaborativo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-20 md:py-32"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Nuestra Esencia
            </span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Construimos sobre la transparencia del blockchain y la fuerza del consenso colectivo
          </p>
          
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 ${
              featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group relative"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur" />
                  <div className="relative p-6 bg-card rounded-2xl border border-border h-full hover:border-transparent transition-all duration-300">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Forums Highlight */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-cyan-500/10 to-primary/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-cyan-500 rounded-2xl mb-8 shadow-lg shadow-primary/30">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              El <span className="text-primary">Corazón</span> de la Plataforma
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              Los foros de discusión no son espacios vacíos: son creados y alimentados por la misma comunidad. 
              <span className="text-primary font-medium"> Cada opinión, cada voto, cada aporte suma</span> para que los 
              artistas emergentes tengan un camino más fácil hacia el desarrollo y la visibilidad.
            </p>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section 
        ref={audienceRef}
        className="py-20 md:py-32"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Queremos <span className="text-primary">Acercar</span> a Todos
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Una red que conecta talentos, oportunidades y pasiones
          </p>
          
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto transition-all duration-1000 ${
              audienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {audience.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="group flex items-center gap-5 p-5 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-foreground/90 font-medium">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="py-20 md:py-32 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
        <div 
          className={`container mx-auto px-4 text-center relative transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan-500 to-primary rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative p-10 md:p-16 bg-card rounded-3xl border border-primary/30 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-8">
                    <HandHeart className="w-8 h-8 text-primary" />
                  </div>
                  
                  <p className="text-lg md:text-xl text-foreground/90 leading-relaxed mb-8">
                    Este es un llamado a quienes creen que la cultura puede ser más democrática, más transparente y más humana. 
                    <span className="text-primary font-semibold"> Red Akasha.org no es solo una plataforma: es un movimiento.</span>
                  </p>
                  
                  <p className="text-muted-foreground mb-10">
                    Es la oportunidad de construir juntos una red donde el arte se expanda sin fronteras y donde cada persona 
                    que se asocie sienta que está dejando huella en la historia de nuestra música y nuestro idioma.
                  </p>

                  <div className="border-t border-border pt-10">
                    <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent mb-4">
                      Sumate, asociate, colaborá.
                    </p>
                    <p className="text-muted-foreground mb-8">
                      Porque la industria que soñamos empieza aquí, y empieza con vos.
                    </p>
                    
                    <Link to="/asociate">
                      <Button size="lg" className="group text-lg px-10 py-6 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90">
                        Asociate Gratis
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProyectoRedAkasha;

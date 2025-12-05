import { Globe, Users, Music, Vote, Building2, Heart, MessageSquare, Sparkles, Target, HandHeart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
    { icon: Music, text: "Músicos que buscan ser escuchados" },
    { icon: Building2, text: "Productores y estudios que desean colaborar con nuevos talentos" },
    { icon: Target, text: "Teatros y venues que quieren abrir sus puertas a propuestas frescas" },
    { icon: Heart, text: "Consumidores de buen contenido que valoran el arte auténtico" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div 
          className={`container mx-auto px-4 text-center relative z-10 transition-all duration-1000 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex justify-center mb-6">
            <Globe className="w-16 h-16 md:w-20 md:h-20 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
            Red Akasha.org
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Una voz colectiva para la música y el arte emergente
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section 
        ref={missionRef}
        className="py-12 md:py-20"
      >
        <div 
          className={`container mx-auto px-4 transition-all duration-1000 ${
            missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <div className="p-6 md:p-8 bg-secondary/50 rounded-2xl border border-border">
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
                En un mundo donde demasiadas veces el talento queda silenciado por la falta de oportunidades, 
                <span className="text-primary font-semibold"> Red Akasha</span> nace como un espacio libre, abierto y colaborativo. 
                Una plataforma digital de contenidos audiovisuales que une a músicos, productores, estudios, teatros, 
                venues y amantes del buen gusto en torno a un mismo sueño: <span className="text-primary font-semibold">dar voz y voto a los artistas 
                que aún no han sido reconocidos por la industria tradicional.</span>
              </p>
            </div>
            
            <div className="p-6 md:p-8 bg-secondary/30 rounded-2xl border border-border/50">
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                Aquí, cada usuario puede asociarse de manera gratuita y convertirse en parte activa de una comunidad 
                que se construye sobre la transparencia del blockchain y la fuerza del consenso. No se trata solo de 
                escuchar música: se trata de <span className="text-primary">participar en la creación de una nueva industria cultural</span>, 
                donde el valor del contenido se mide por el aporte de la comunidad y el apoyo de empresas que creen 
                en un futuro más justo y colaborativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-12 md:py-20 bg-secondary/20"
      >
        <div className="container mx-auto px-4">
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
                  className="p-6 bg-background rounded-xl border border-border hover:border-primary transition-all duration-300 hover:shadow-glow group"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Forums Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-primary" />
            </div>
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              En Red Akasha, los foros de discusión no son espacios vacíos: son el <span className="text-primary font-semibold">corazón de la plataforma</span>, 
              creados y alimentados por la misma comunidad. Cada opinión, cada voto, cada aporte suma para que los 
              artistas emergentes tengan un camino más fácil hacia el desarrollo y la visibilidad.
            </p>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section 
        ref={audienceRef}
        className="py-12 md:py-20 bg-secondary/20"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
            Queremos acercar a todos
          </h2>
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto transition-all duration-1000 ${
              audienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {audience.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border hover:border-primary transition-all duration-300"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm md:text-base text-foreground/90">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="py-16 md:py-24"
      >
        <div 
          className={`container mx-auto px-4 text-center transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-3xl mx-auto p-8 md:p-12 bg-gradient-to-br from-primary/20 via-secondary to-primary/10 rounded-3xl border border-primary/30">
            <HandHeart className="w-12 h-12 text-primary mx-auto mb-6" />
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-6">
              Este es un llamado a quienes creen que la cultura puede ser más democrática, más transparente y más humana. 
              <span className="text-primary font-semibold"> Red Akasha.org no es solo una plataforma: es un movimiento.</span> Es la oportunidad 
              de construir juntos una red donde el arte se expanda sin fronteras y donde cada persona que se asocie 
              sienta que está dejando huella en la historia de nuestra música y nuestro idioma.
            </p>
            <div className="border-t border-primary/30 pt-6 mt-6">
              <p className="text-xl md:text-2xl font-bold text-primary mb-2">
                Sumate, asociate, colaborá.
              </p>
              <p className="text-muted-foreground">
                Porque la industria que soñamos empieza aquí, y empieza con vos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProyectoRedAkasha;

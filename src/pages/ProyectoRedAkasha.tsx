import { Users, Music, Vote, Building2, Heart, MessageSquare, Sparkles, Target, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoAkasha from "@/assets/logo-akasha-cyan.png";

const ProyectoRedAkasha = () => {
  const features = [
    {
      icon: Users,
      title: "Comunidad Colaborativa",
      description: "Asociate gratis y sé parte activa de una comunidad transparente."
    },
    {
      icon: Vote,
      title: "Voz y Voto",
      description: "El valor del contenido lo define la comunidad y el consenso colectivo."
    },
    {
      icon: MessageSquare,
      title: "Foros Activos",
      description: "Espacios de discusión creados y alimentados por la comunidad."
    },
    {
      icon: Sparkles,
      title: "Blockchain",
      description: "Transparencia y seguridad respaldadas por tecnología blockchain.",
      badge: "Próximamente"
    }
  ];

  const audience = [
    { icon: Music, text: "Músicos que buscan ser escuchados" },
    { icon: Building2, text: "Productores y estudios que quieren colaborar con nuevos talentos" },
    { icon: Target, text: "Teatros y venues abiertos a propuestas frescas" },
    { icon: Heart, text: "Consumidores que valoran el arte auténtico" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <img 
            src={logoAkasha} 
            alt="Red Akasha" 
            className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-8 object-contain"
          />

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Red Akasha<span className="text-primary">.org</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Una voz colectiva para la música y el arte emergente
          </p>

          <Link to="/asociate">
            <Button size="lg" className="text-base px-8">
              Únete al Movimiento
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-6 text-center">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              En un mundo donde el talento queda silenciado por falta de oportunidades, 
              <strong className="text-primary"> Red Akasha</strong> nace como un espacio libre, abierto y colaborativo.
            </p>
            
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
              Una plataforma que une a músicos, productores, estudios, teatros y venues 
              en torno a un mismo sueño: <strong className="text-primary">dar voz y voto a los artistas emergentes.</strong>
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              No se trata solo de escuchar música: se trata de participar en la creación 
              de una nueva industria cultural donde el valor lo define la comunidad.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Nuestra Esencia
            </h2>
            <p className="text-muted-foreground">
              Transparencia, consenso colectivo y tecnología al servicio del arte
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    {feature.title}
                    {feature.badge && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {feature.badge}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Forums Highlight */}
      <section className="py-16 md:py-20 bg-card/50">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <MessageSquare className="w-10 h-10 text-primary mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            El Corazón de la Plataforma
          </h2>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
            Los foros no son espacios vacíos: son creados y alimentados por la comunidad. 
            Cada opinión, cada voto, cada aporte suma para que los artistas emergentes 
            tengan un camino más fácil hacia la visibilidad.
          </p>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Queremos Acercar a Todos
            </h2>
            <p className="text-muted-foreground">
              Una red que conecta talentos, oportunidades y pasiones
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {audience.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-6">
            Red Akasha no es solo una plataforma: es un movimiento. 
            La oportunidad de construir juntos una red donde el arte se expanda sin fronteras 
            y cada persona que se asocie deje huella en la historia de nuestra música.
          </p>
          
          <p className="text-xl md:text-2xl font-bold text-primary mb-2">
            Sumate, asociate, colaborá.
          </p>
          <p className="text-muted-foreground mb-8">
            Porque la industria que soñamos empieza aquí, y empieza con vos.
          </p>
          
          <Link to="/asociate">
            <Button size="lg" className="text-base px-10">
              Asociate Gratis
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProyectoRedAkasha;

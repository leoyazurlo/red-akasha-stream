import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";

const Forum = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />
      
      <main className="relative z-10 pt-24">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
            <h1 className="text-4xl md:text-5xl font-poppins font-medium tracking-wide text-foreground text-center relative animate-slide-in">
              Foro de debates para la reforma y armado de la plataforma
            </h1>
          </div>

          {/* Content Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8 shadow-card">
              <p className="text-muted-foreground text-center text-lg">
                Próximamente: Espacio de debate y colaboración para la comunidad
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Forum;

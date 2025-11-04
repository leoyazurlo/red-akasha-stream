import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ForumCategories } from "@/components/forum/ForumCategories";
import { ForumStats } from "@/components/forum/ForumStats";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Forum = () => {
  const { user, loading } = useAuth(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              Foro Red Akasha
            </h1>
            <p className="text-muted-foreground text-center mt-4 text-lg">
              Espacio de debate y colaboración para la comunidad
            </p>
          </div>

          {/* Stats Section */}
          <ForumStats />

          {/* Categories Section */}
          <ForumCategories />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Forum;

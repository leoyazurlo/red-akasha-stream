import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ArtistLiveMap } from "@/components/live-map/artist-live-map";
import { useSEO } from "@/hooks/use-seo";
import { generateMapSEO } from "@/lib/seo";

const LiveMap = () => {
  useSEO(generateMapSEO());
  return (
    <div className="min-h-screen bg-background relative">
      <CosmicBackground />
      <div className="relative z-10">
        <Header />
        <main id="main-content" className="pt-20 pb-4 px-2 sm:px-4">
          <ArtistLiveMap />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LiveMap;

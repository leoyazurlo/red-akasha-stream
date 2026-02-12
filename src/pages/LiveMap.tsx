import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ArtistLiveMap } from "@/components/live-map/artist-live-map";

const LiveMap = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <CosmicBackground />
      <div className="relative z-10">
        <Header />
        <main className="pt-20 pb-4 px-2 sm:px-4">
          <ArtistLiveMap />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LiveMap;

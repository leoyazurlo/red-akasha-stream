import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoCarousel } from "@/components/VideoCarousel";
import { VideoRanking } from "@/components/VideoRanking";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import akashaBg from "@/assets/akasha-bg.png";

// Mock data for video carousels
const programasVideos = [
  {
    id: "p1",
    title: "Arte Urbano: Nuevas Expresiones",
    thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=225&fit=crop",
    duration: "45:30",
  },
  {
    id: "p2",
    title: "Entrevista con Productores Emergentes",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop",
    duration: "38:15",
  },
  {
    id: "p3",
    title: "Espacios Creativos: Estudios de Grabación",
    thumbnail: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&h=225&fit=crop",
    duration: "52:40",
  },
  {
    id: "p4",
    title: "Producción Musical en Vivo",
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop",
    duration: "41:20",
  },
  {
    id: "p5",
    title: "Tecnología en el Arte Contemporáneo",
    thumbnail: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=225&fit=crop",
    duration: "36:45",
  },
];

const shortVideos = [
  {
    id: "s1",
    title: "Tips de Producción: Ecualización",
    thumbnail: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=225&fit=crop",
    duration: "3:45",
  },
  {
    id: "s2",
    title: "Detrás de Cámaras: Sesión Fotográfica",
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
    duration: "2:30",
  },
  {
    id: "s3",
    title: "Setup de Estudio en Casa",
    thumbnail: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=225&fit=crop",
    duration: "4:15",
  },
  {
    id: "s4",
    title: "Técnicas de Mezcla Rápida",
    thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=225&fit=crop",
    duration: "3:20",
  },
  {
    id: "s5",
    title: "Iluminación para Video",
    thumbnail: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&h=225&fit=crop",
    duration: "2:55",
  },
];

const destacadosVideos = [
  {
    id: "d1",
    title: "Concierto Acústico: Sala Íntima",
    thumbnail: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=225&fit=crop",
    duration: "1:15:30",
  },
  {
    id: "d2",
    title: "Festival Red Akasha 2024",
    thumbnail: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=225&fit=crop",
    duration: "2:30:45",
  },
  {
    id: "d3",
    title: "Documental: La Escena Underground",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop",
    duration: "58:20",
  },
  {
    id: "d4",
    title: "Masterclass de Producción",
    thumbnail: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=225&fit=crop",
    duration: "1:42:15",
  },
  {
    id: "d5",
    title: "Showcase de Artistas Nuevos",
    thumbnail: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&h=225&fit=crop",
    duration: "1:05:30",
  },
];

const rankingVideos = [
  {
    id: "r1",
    rank: 1,
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop",
    artist: "Los Nocheros del Sur",
    genre: "Folklore Urbano",
    country: "Argentina",
    countryFlag: "🇦🇷",
    rating: 4.8,
    totalVotes: 342,
  },
  {
    id: "r2",
    rank: 2,
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop",
    artist: "María Paz & Banda",
    genre: "Rock Alternativo",
    country: "México",
    countryFlag: "🇲🇽",
    rating: 4.7,
    totalVotes: 298,
  },
  {
    id: "r3",
    rank: 3,
    thumbnail: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=225&fit=crop",
    artist: "Daniela Soares",
    genre: "Bossa Nova Fusion",
    country: "Brasil",
    countryFlag: "🇧🇷",
    rating: 4.6,
    totalVotes: 275,
  },
  {
    id: "r4",
    rank: 4,
    thumbnail: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=225&fit=crop",
    artist: "Colectivo Raíz",
    genre: "Cumbia Experimental",
    country: "Colombia",
    countryFlag: "🇨🇴",
    rating: 4.5,
    totalVotes: 261,
  },
  {
    id: "r5",
    rank: 5,
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop",
    artist: "Inti Wayra",
    genre: "Andino Contemporáneo",
    country: "Perú",
    countryFlag: "🇵🇪",
    rating: 4.4,
    totalVotes: 247,
  },
  {
    id: "r6",
    rank: 6,
    thumbnail: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=225&fit=crop",
    artist: "Pablo Montero Trío",
    genre: "Jazz Latino",
    country: "España",
    countryFlag: "🇪🇸",
    rating: 4.3,
    totalVotes: 233,
  },
  {
    id: "r7",
    rank: 7,
    thumbnail: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&h=225&fit=crop",
    artist: "Electro Mapuche",
    genre: "Electrónica Ancestral",
    country: "Chile",
    countryFlag: "🇨🇱",
    rating: 4.2,
    totalVotes: 219,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Cosmic background */}
      <CosmicBackground />
      
      {/* Background pattern with soft opacity */}
      <div 
        className="fixed inset-0 opacity-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${akashaBg})`,
          backgroundSize: '800px 800px',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      
      <div className="relative z-10">
        <Header />
      
      <main>
        <VideoPlayer />
        
        <div className="space-y-8 pb-8">
          <VideoCarousel
            title="Programas"
            videos={programasVideos}
            sectionId="programas"
          />
          
      <VideoCarousel 
        title="Shorts" 
        videos={shortVideos} 
        sectionId="short"
      />
          
          <VideoCarousel
            title="Destacados"
            videos={destacadosVideos}
            sectionId="destacados"
          />

          <VideoRanking videos={rankingVideos} />
        </div>
      </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;

import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoCarousel } from "@/components/VideoCarousel";
import { VideoRanking } from "@/components/VideoRanking";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import akashaBg from "@/assets/akasha-bg.png";

// Videos de YouTube para el carrusel de Programas
const programasVideos = [
  {
    id: "p1",
    title: "Arte Urbano: Nuevas Expresiones",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "45:30",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    id: "p2",
    title: "Entrevista con Productores Emergentes",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    duration: "38:15",
    youtubeId: "9bZkp7q19f0",
  },
  {
    id: "p3",
    title: "Espacios Creativos: Estudios de Grabación",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
    duration: "52:40",
    youtubeId: "kJQP7kiw5Fk",
  },
  {
    id: "p4",
    title: "Producción Musical en Vivo",
    thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg",
    duration: "41:20",
    youtubeId: "JGwWNGJdvx8",
  },
  {
    id: "p5",
    title: "Tecnología en el Arte Contemporáneo",
    thumbnail: "https://img.youtube.com/vi/Zi_XLOBDo_Y/maxresdefault.jpg",
    duration: "36:45",
    youtubeId: "Zi_XLOBDo_Y",
  },
];

// Videos de YouTube para el carrusel de Shorts
const shortVideos = [
  {
    id: "s1",
    title: "Tips de Producción: Ecualización",
    thumbnail: "https://img.youtube.com/vi/3tmd-ClpJxA/maxresdefault.jpg",
    duration: "3:45",
    youtubeId: "3tmd-ClpJxA",
  },
  {
    id: "s2",
    title: "Detrás de Cámaras: Sesión Fotográfica",
    thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg",
    duration: "2:30",
    youtubeId: "YQHsXMglC9A",
  },
  {
    id: "s3",
    title: "Setup de Estudio en Casa",
    thumbnail: "https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg",
    duration: "4:15",
    youtubeId: "LXb3EKWsInQ",
  },
  {
    id: "s4",
    title: "Técnicas de Mezcla Rápida",
    thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
    duration: "3:20",
    youtubeId: "fJ9rUzIMcZQ",
  },
  {
    id: "s5",
    title: "Iluminación para Video",
    thumbnail: "https://img.youtube.com/vi/V-fRuoMIfpw/maxresdefault.jpg",
    duration: "2:55",
    youtubeId: "V-fRuoMIfpw",
  },
];

// Videos de YouTube para el carrusel de Destacados
const destacadosVideos = [
  {
    id: "d1",
    title: "Concierto Acústico: Sala Íntima",
    thumbnail: "https://img.youtube.com/vi/OPf0YbXqDm0/maxresdefault.jpg",
    duration: "1:15:30",
    youtubeId: "OPf0YbXqDm0",
  },
  {
    id: "d2",
    title: "Festival Red Akasha 2024",
    thumbnail: "https://img.youtube.com/vi/hTWKbfoikeg/maxresdefault.jpg",
    duration: "2:30:45",
    youtubeId: "hTWKbfoikeg",
  },
  {
    id: "d3",
    title: "Documental: La Escena Underground",
    thumbnail: "https://img.youtube.com/vi/djV11Xbc914/maxresdefault.jpg",
    duration: "58:20",
    youtubeId: "djV11Xbc914",
  },
  {
    id: "d4",
    title: "Masterclass de Producción",
    thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg",
    duration: "1:42:15",
    youtubeId: "M7lc1UVf-VE",
  },
  {
    id: "d5",
    title: "Showcase de Artistas Nuevos",
    thumbnail: "https://img.youtube.com/vi/RgKAFK5djSk/maxresdefault.jpg",
    duration: "1:05:30",
    youtubeId: "RgKAFK5djSk",
  },
];

// Este mock data ya no se usa - VideoRanking ahora carga contenido real de usuarios desde la BD

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />
      
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
      
      <main className="pt-16">
        <VideoPlayer />
        
        <div className="space-y-8 pb-8">
          <VideoCarousel
            title="Programas"
            videos={programasVideos}
            sectionId="programas"
            showSchedule={true}
            loadSchedulesFromDB={true}
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

          <VideoRanking />
        </div>
      </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;

import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoCarousel } from "@/components/VideoCarousel";
import { VideoRanking } from "@/components/VideoRanking";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import akashaBg from "@/assets/akasha-bg.png";

const Index = () => {
  // Cargar videos de YouTube desde la base de datos
  const { data: programasVideos = [] } = useQuery({
    queryKey: ["youtube-videos", "programas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("*")
        .eq("category", "programas")
        .eq("is_active", true)
        .order("order_index");
      
      if (error) throw error;
      
      return data.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
        duration: v.duration,
        youtubeId: v.youtube_id,
      }));
    },
  });

  const { data: shortVideos = [] } = useQuery({
    queryKey: ["youtube-videos", "shorts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("*")
        .eq("category", "shorts")
        .eq("is_active", true)
        .order("order_index");
      
      if (error) throw error;
      
      return data.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
        duration: v.duration,
        youtubeId: v.youtube_id,
      }));
    },
  });

  const { data: destacadosVideos = [] } = useQuery({
    queryKey: ["content-destacados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_uploads")
        .select("*")
        .eq("status", "approved")
        .order("likes_count", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return data.map((v) => {
        const durationInSeconds = v.video_duration_seconds || v.audio_duration_seconds || 0;
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return {
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail_url || v.thumbnail_large || v.thumbnail_medium || v.thumbnail_small || '',
          duration: duration,
        };
      });
    },
  });

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

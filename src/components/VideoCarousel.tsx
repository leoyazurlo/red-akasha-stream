import { ChevronLeft, ChevronRight, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ResponsiveImage } from "@/components/ui/responsive-image";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  youtubeId?: string;
  country?: string | null;
}

const countryFlags: Record<string, string> = {
  "Argentina": "🇦🇷",
  "Bolivia": "🇧🇴",
  "Brasil": "🇧🇷",
  "Chile": "🇨🇱",
  "Colombia": "🇨🇴",
  "Costa Rica": "🇨🇷",
  "Cuba": "🇨🇺",
  "Ecuador": "🇪🇨",
  "El Salvador": "🇸🇻",
  "Guatemala": "🇬🇹",
  "Honduras": "🇭🇳",
  "México": "🇲🇽",
  "Nicaragua": "🇳🇮",
  "Panamá": "🇵🇦",
  "Paraguay": "🇵🇾",
  "Perú": "🇵🇪",
  "República Dominicana": "🇩🇴",
  "Uruguay": "🇺🇾",
  "Venezuela": "🇻🇪",
  "España": "🇪🇸",
  "Estados Unidos": "🇺🇸",
};

interface ProgramSchedule {
  time: string;
  day: string;
  image?: string;
}

interface VideoCarouselProps {
  title: string;
  videos: VideoItem[];
  sectionId: string;
  showSchedule?: boolean;
  loadSchedulesFromDB?: boolean;
}

export const VideoCarousel = ({ 
  title, 
  videos, 
  sectionId, 
  showSchedule = false,
  loadSchedulesFromDB = false
}: VideoCarouselProps) => {
  const { t } = useTranslation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const navigate = useNavigate();

  // Fetch schedules from database if enabled
  const { data: dbSchedules } = useQuery({
    queryKey: ["program-schedules-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_schedules")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;

      return data.map((s) => ({
        day: s.day,
        time: s.time,
        image: s.image_url || undefined,
      }));
    },
    enabled: loadSchedulesFromDB && showSchedule,
  });

  const schedules = loadSchedulesFromDB ? dbSchedules || [] : [];

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById(`carousel-${sectionId}`);
    if (container) {
      const scrollAmount = 240;
      const newPosition =
        direction === "left"
          ? Math.max(0, scrollPosition - scrollAmount)
          : Math.min(
              container.scrollWidth - container.clientWidth,
              scrollPosition + scrollAmount
            );
      
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section 
      ref={elementRef}
      className={`py-4 md:py-8 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`} 
      id={sectionId}
    >
      <div className="container mx-auto px-2 sm:px-4">
        {/* Section Title */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 md:mb-8 max-w-4xl mx-auto">
          {/* Title and Schedule Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-poppins font-medium tracking-wide text-foreground relative animate-slide-in truncate">
                {title}
              </h2>
            </div>
            
            {showSchedule && schedules.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 sm:gap-2 bg-card/80 backdrop-blur-sm border-primary/30 hover:border-primary hover:bg-card z-50 h-9 md:h-10 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0"
                  >
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">{t('home.schedules')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-56 sm:w-64 bg-card/95 backdrop-blur-md border-border/50 z-[100]"
                >
                  {schedules.map((schedule, index) => (
                    <DropdownMenuItem 
                      key={index}
                      className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-primary/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-primary">{schedule.day}</span>
                        <span className="text-sm text-muted-foreground">{schedule.time}</span>
                      </div>
                      {schedule.image && (
                        <ResponsiveImage
                          src={schedule.image} 
                          alt={`${schedule.day} program`}
                          sizes="256px"
                          className="w-full h-32 object-cover rounded-md border border-border"
                        />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Carousel Container with Glow Effect - Responsive padding */}
        <div className="relative max-w-5xl mx-auto">
          {/* Outer glow container */}
          <div className="absolute inset-0 bg-gradient-glow opacity-10 rounded-2xl md:rounded-3xl blur-2xl" />
          
          {/* Left Arrow - Over videos */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 md:h-12 md:w-12 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300"
          >
            <ChevronLeft className="h-6 w-6 md:h-7 md:w-7 text-cyan-400" />
          </Button>

          {/* Right Arrow - Over videos */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 md:h-12 md:w-12 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300"
          >
            <ChevronRight className="h-6 w-6 md:h-7 md:w-7 text-cyan-400" />
          </Button>
          
          {/* Inner container with border */}
          <div className="relative bg-card/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-border/50 p-3 sm:p-4 md:p-6 shadow-glow">
            <div
              id={`carousel-${sectionId}`}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 md:px-10"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  data-index={index}
                  onClick={() => {
                    if (video.youtubeId) {
                      setSelectedVideo(video);
                    } else {
                      // Navigate to video detail page for content_uploads
                      navigate(`/video/${video.id}`);
                    }
                  }}
                  className={`flex-none w-44 sm:w-52 md:w-56 group cursor-pointer transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                  }`}
                  style={{ 
                    transitionDelay: isVisible ? `${index * 75}ms` : '0ms'
                  }}
                >
                <div className="p-1">
                  <div className="relative aspect-video bg-card rounded-lg md:rounded-xl overflow-hidden border-2 border-cyan-400/50 transition-all duration-300 group-hover:border-cyan-400 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]" style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}>
                    {/* Thumbnail */}
                    <ResponsiveImage
                      src={video.thumbnail}
                      alt={video.title}
                      sizes="(max-width: 640px) 176px, (max-width: 768px) 208px, 224px"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Play button on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/90 rounded-full flex items-center justify-center group-hover:animate-float">
                        <Play className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2 bg-black/80 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs font-light backdrop-blur-sm">
                      {video.duration}
                    </div>

                    {/* Country flag */}
                    {video.country && countryFlags[video.country] && (
                      <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 text-lg md:text-xl drop-shadow-lg" title={video.country}>
                        {countryFlags[video.country]}
                      </div>
                    )}
                </div>
                  </div>

                  {/* Title - Centered below video */}
                  <h3 className="mt-2 md:mt-3 text-xs sm:text-sm font-light text-foreground text-center line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para reproducir video de YouTube */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-medium">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {selectedVideo?.youtubeId && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-b-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
import { ChevronLeft, ChevronRight, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

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
  const [scrollPosition, setScrollPosition] = useState(0);

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
    <section className="py-4 md:py-8" id={sectionId}>
      <div className="container mx-auto px-2 sm:px-4">
        {/* Section Title with Navigation Arrows on Sides */}
        <div className="flex items-center justify-between md:justify-center gap-2 sm:gap-4 mb-4 md:mb-8 max-w-4xl mx-auto">
          {/* Left Arrow - Larger on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="hover:bg-secondary hover:scale-110 transition-all duration-300 flex-shrink-0 h-10 w-10 md:h-12 md:w-12"
          >
            <ChevronLeft className="h-6 w-6 md:h-5 md:w-5 text-primary" />
          </Button>

          {/* Title and Schedule Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center overflow-hidden">
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
                    <span className="hidden sm:inline">Horarios</span>
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
                        <img 
                          src={schedule.image} 
                          alt={`${schedule.day} program`}
                          className="w-full h-32 object-cover rounded-md border border-border"
                        />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Arrow - Larger on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="hover:bg-secondary hover:scale-110 transition-all duration-300 flex-shrink-0 h-10 w-10 md:h-12 md:w-12"
          >
            <ChevronRight className="h-6 w-6 md:h-5 md:w-5 text-primary" />
          </Button>
        </div>

        {/* Carousel Container with Glow Effect - Responsive padding */}
        <div className="relative max-w-5xl mx-auto">
          {/* Outer glow container */}
          <div className="absolute inset-0 bg-gradient-glow opacity-10 rounded-2xl md:rounded-3xl blur-2xl" />
          
          {/* Inner container with border */}
          <div className="relative bg-card/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-border/50 p-3 sm:p-4 md:p-6 shadow-glow">
            <div
              id={`carousel-${sectionId}`}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex-none w-44 sm:w-52 md:w-56 group cursor-pointer animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-video bg-card rounded-lg md:rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105">
                    {/* Thumbnail */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/90 rounded-full flex items-center justify-center group-hover:animate-float">
                        <Play className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 bg-black/80 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs font-light backdrop-blur-sm">
                      {video.duration}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-2 md:mt-3 text-xs sm:text-sm font-light text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

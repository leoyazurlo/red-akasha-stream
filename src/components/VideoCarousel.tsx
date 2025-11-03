import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

interface VideoCarouselProps {
  title: string;
  videos: VideoItem[];
  sectionId: string;
}

export const VideoCarousel = ({ title, videos, sectionId }: VideoCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);

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
    <section className="py-8" id={sectionId}>
      <div className="container mx-auto px-4">
        {/* Section Title with Glow Effect */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
          <h2 className="text-2xl md:text-3xl font-poppins font-medium tracking-wide text-foreground text-center relative animate-slide-in">
            {title}
          </h2>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll("left")}
              className="hover:bg-secondary hover:scale-110 transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll("right")}
              className="hover:bg-secondary hover:scale-110 transition-all duration-300"
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Carousel Container with Glow Effect */}
        <div className="relative">
          {/* Outer glow container */}
          <div className="absolute inset-0 bg-gradient-glow opacity-10 rounded-3xl blur-2xl" />
          
          {/* Inner container with border */}
          <div className="relative bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-glow">
            <div
              id={`carousel-${sectionId}`}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex-none w-56 group cursor-pointer animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-video bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-300 hover:shadow-glow hover:scale-105">
                    {/* Thumbnail */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-14 h-14 bg-primary/90 rounded-full flex items-center justify-center group-hover:animate-float">
                        <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-1" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-light backdrop-blur-sm">
                      {video.duration}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-sm font-light text-foreground line-clamp-2 group-hover:text-primary transition-colors">
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

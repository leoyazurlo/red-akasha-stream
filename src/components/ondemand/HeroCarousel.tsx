import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  thumbnail_url: string | null;
  views_count: number;
  is_free: boolean;
  price: number;
  currency: string;
  band_name: string | null;
}

interface HeroCarouselProps {
  contents: Content[];
  onContentClick: (content: Content) => void;
}

export const HeroCarousel = ({ contents, onContentClick }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();

  // Get top 5 featured contents (most viewed)
  const featuredContents = contents
    .slice()
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 5);

  const goToNext = useCallback(() => {
    if (featuredContents.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % featuredContents.length);
  }, [featuredContents.length]);

  const goToPrevious = useCallback(() => {
    if (featuredContents.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + featuredContents.length) % featuredContents.length);
  }, [featuredContents.length]);

  useEffect(() => {
    if (!isAutoPlaying || featuredContents.length <= 1) return;
    
    const interval = setInterval(goToNext, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext, featuredContents.length]);

  if (featuredContents.length === 0) return null;

  const currentContent = featuredContents[currentIndex];

  return (
    <div 
      className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12 group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
        {currentContent.thumbnail_url ? (
          <img
            src={currentContent.thumbnail_url}
            alt={currentContent.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30" />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Animated Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-pulse" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 animate-fade-in">
            <Badge className="bg-primary/90 text-primary-foreground flex items-center gap-1">
              <Star className="w-3 h-3" />
              Destacado
            </Badge>
            {currentContent.is_free ? (
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                Gratis
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none">
                ${currentContent.price} {currentContent.currency}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {currentContent.title}
          </h2>

          {/* Description */}
          {currentContent.description && (
            <p className="text-muted-foreground text-sm md:text-base line-clamp-2 max-w-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {currentContent.description}
            </p>
          )}

          {/* Meta Info */}
          {currentContent.band_name && (
            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.25s' }}>
              Por: <span className="text-foreground font-medium">{currentContent.band_name}</span>
            </p>
          )}

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
            onClick={() => onContentClick(currentContent)}
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Ver ahora
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {featuredContents.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/30 hover:bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/30 hover:bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Pagination Dots */}
      {featuredContents.length > 1 && (
        <div className="absolute bottom-6 right-6 md:right-10 flex items-center gap-2 z-20">
          {featuredContents.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-foreground/30 hover:bg-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

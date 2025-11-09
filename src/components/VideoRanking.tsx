import { Play, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RankingVideo {
  id: string;
  rank: number;
  thumbnail: string;
  artist: string;
  genre: string;
  country: string;
  countryFlag: string;
  rating: number;
  totalVotes: number;
}

interface VideoRankingProps {
  videos: RankingVideo[];
}

export const VideoRanking = ({ videos }: VideoRankingProps) => {
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({});

  const handleRating = (videoId: string, rating: number) => {
    setUserRatings(prev => ({ ...prev, [videoId]: rating }));
    // Aquí se conectaría con Lovable Cloud para guardar la calificación
  };

  return (
    <section className="py-8 md:py-12" id="ranking">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="relative mb-6 md:mb-8">
          <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-poppins font-medium tracking-wide text-foreground text-center relative animate-slide-in px-4">
            Rankings de Videos
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
          {videos.map((video, index) => (
            <Card key={video.id} className="p-3 sm:p-4 hover:shadow-glow transition-all duration-300 backdrop-blur-sm bg-card/50 animate-slide-in hover:scale-[1.02]" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex gap-2 sm:gap-4">
                {/* Rank Number */}
                <div className="flex items-center justify-center w-6 sm:w-8 shrink-0">
                  <span className="text-xl sm:text-2xl font-light text-primary">
                    {video.rank}
                  </span>
                </div>

                {/* Video Thumbnail */}
                <div className="relative w-24 sm:w-32 md:w-40 aspect-video shrink-0 rounded-md sm:rounded-lg overflow-hidden bg-card border border-border group cursor-pointer">
                  <img
                    src={video.thumbnail}
                    alt={video.artist}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/90 rounded-full flex items-center justify-center group-hover:animate-float">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground truncate">
                      {video.artist}
                    </h3>
                    <p className="text-xs sm:text-sm font-light text-muted-foreground truncate">
                      {video.genre}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <span className="text-base sm:text-xl">{video.countryFlag}</span>
                      <span className="text-xs sm:text-sm font-light text-muted-foreground truncate">
                        {video.country}
                      </span>
                    </div>
                  </div>

                  {/* Rating - Stack on mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                    <div className="flex gap-0.5 sm:gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-transparent hover:scale-125 transition-transform duration-200"
                          onClick={() => handleRating(video.id, star)}
                        >
                          <Star
                            className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 ${
                              star <= (userRatings[video.id] || video.rating)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm font-light text-muted-foreground">
                      {video.rating.toFixed(1)} ({video.totalVotes})
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

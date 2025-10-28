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
    <section className="py-12" id="ranking">
      <div className="container mx-auto px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
          <h2 className="text-3xl md:text-4xl font-light tracking-wide text-foreground text-center relative animate-slide-in">
            Ranking de Videos
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-3">
          {videos.map((video, index) => (
            <Card key={video.id} className="p-4 hover:shadow-glow transition-all duration-300 backdrop-blur-sm bg-card/50 animate-slide-in hover:scale-[1.02]" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex gap-4">
                {/* Rank Number */}
                <div className="flex items-center justify-center w-8 shrink-0">
                  <span className="text-2xl font-light text-primary">
                    {video.rank}
                  </span>
                </div>

                {/* Video Thumbnail */}
                <div className="relative w-40 aspect-video shrink-0 rounded-lg overflow-hidden bg-card border border-border group cursor-pointer">
                  <img
                    src={video.thumbnail}
                    alt={video.artist}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 bg-primary/90 rounded-full flex items-center justify-center group-hover:animate-float">
                      <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-lg font-medium text-foreground truncate">
                      {video.artist}
                    </h3>
                    <p className="text-sm font-light text-muted-foreground">
                      {video.genre}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl">{video.countryFlag}</span>
                      <span className="text-sm font-light text-muted-foreground">
                        {video.country}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 hover:bg-transparent hover:scale-125 transition-transform duration-200"
                          onClick={() => handleRating(video.id, star)}
                        >
                          <Star
                            className={`h-4 w-4 transition-all duration-200 ${
                              star <= (userRatings[video.id] || video.rating)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                    <span className="text-sm font-light text-muted-foreground">
                      {video.rating.toFixed(1)} ({video.totalVotes} votos)
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

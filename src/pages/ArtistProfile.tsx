import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Star, 
  Share2, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowLeft,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Youtube,
  Music2,
  Image as ImageIcon,
  Video as VideoIcon,
  Play
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFollowArtist, useIsFollowing, useRateArtist, useUserRating } from "@/hooks/useArtists";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const GENRE_LABELS: Record<string, string> = {
  banda_musical: "Banda Musical",
  musico_solista: "Músico Solista",
  podcast: "Podcast",
  documental: "Documental",
  cortometraje: "Cortometraje",
  fotografia: "Fotografía",
  radio_show: "Radio Show",
};

export default function ArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showRating, setShowRating] = useState(false);

  const { data: isFollowing = false } = useIsFollowing(id!);
  const { data: userRating } = useUserRating(id!);
  const followMutation = useFollowArtist();
  const rateMutation = useRateArtist();

  // Fetch artist data
  const { data: artist, isLoading: loadingArtist } = useQuery({
    queryKey: ['artist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch multimedia (photos and videos)
  const { data: gallery = [], isLoading: loadingGallery } = useQuery({
    queryKey: ['artist-gallery', artist?.user_id],
    queryFn: async () => {
      if (!artist?.user_id) return [];
      
      const { data: profileData } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', artist.user_id)
        .single();

      if (!profileData) return [];

      const { data, error } = await supabase
        .from('profile_galleries')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
    enabled: !!artist?.user_id,
  });

  // Fetch audio playlist
  const { data: audioPlaylist = [], isLoading: loadingAudio } = useQuery({
    queryKey: ['artist-audio', artist?.user_id],
    queryFn: async () => {
      if (!artist?.user_id) return [];
      
      const { data: profileData } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', artist.user_id)
        .single();

      if (!profileData) return [];

      const { data, error } = await supabase
        .from('audio_playlist')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
    enabled: !!artist?.user_id,
  });

  // Fetch followers
  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ['artist-followers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_followers')
        .select('follower_id, created_at')
        .eq('artist_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch recent ratings with rater details
  const { data: recentRatings = [] } = useQuery({
    queryKey: ['artist-ratings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_ratings')
        .select(`
          *,
          rater:artists!artist_ratings_user_id_fkey(name, avatar_url)
        `)
        .eq('artist_id', id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleFollow = () => {
    followMutation.mutate({ artistId: id!, isFollowing });
  };

  const handleRate = (rating: number) => {
    rateMutation.mutate({ artistId: id!, rating });
    setShowRating(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: artist?.name,
        text: `Descubre a ${artist?.name} en Red Akasha`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace del artista se copió al portapapeles",
      });
    }
  };

  const photos = gallery.filter(item => item.media_type === 'photo');
  const videos = gallery.filter(item => item.media_type === 'video');

  if (loadingArtist) {
    return (
      <div className="min-h-screen bg-background">
        <CosmicBackground />
        <Header />
        <main className="relative pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <Skeleton className="h-64 w-full mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <CosmicBackground />
        <Header />
        <main className="relative pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h1 className="text-3xl font-bold mb-4">Artista no encontrado</h1>
            <Button onClick={() => navigate('/artistas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Artistas
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CosmicBackground />
      <Header />
      
      <main className="relative pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/artistas')}
            className="mb-6 hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Artistas
          </Button>

          {/* Cover Image */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-elegant">
            <img
              src={artist.cover_image_url || "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=400&fit=crop"}
              alt={`Cover de ${artist.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>

          {/* Profile Header */}
          <div className="relative -mt-32 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={artist.avatar_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop"}
                  alt={`Avatar de ${artist.name}`}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background shadow-glow object-cover"
                />
                {artist.verified && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    ✓ Verificado
                  </Badge>
                )}
              </div>

              {/* Info & Actions */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{artist.name}</h1>
                    <Badge variant="secondary">{GENRE_LABELS[artist.artist_type]}</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    {artist.city && artist.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {artist.city}, {artist.country}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {artist.followers_count} seguidores
                    </span>
                    {artist.average_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {artist.average_rating.toFixed(1)} ({artist.total_votes} votos)
                      </span>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2">
                    {artist.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.youtube_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.youtube_url} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.spotify_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer">
                          <Music2 className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    onClick={handleFollow}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowRating(!showRating)}
                    className="gap-2"
                  >
                    <Star className={`h-4 w-4 ${userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    Valorar
                  </Button>

                  <Button variant="outline" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                </div>

                {/* Rating Stars */}
                {showRating && (
                  <div className="flex gap-1 p-4 bg-muted/50 rounded-lg animate-fade-in">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRate(rating)}
                        className="hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            userRating && rating <= userRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {artist.bio && (
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">Acerca de</h2>
                <p className="text-muted-foreground leading-relaxed">{artist.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="gallery" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto h-auto p-2 bg-card/50">
              <TabsTrigger value="gallery" className="gap-3 py-4 text-lg font-light tracking-widest uppercase">
                <ImageIcon className="h-7 w-7" />
                Galería ({photos.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-3 py-4 text-lg font-light tracking-widest uppercase">
                <VideoIcon className="h-7 w-7" />
                Videos ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-3 py-4 text-lg font-light tracking-widest uppercase">
                <Music2 className="h-7 w-7" />
                Música ({audioPlaylist.length})
              </TabsTrigger>
            </TabsList>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-4">
              {loadingGallery ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <Card key={photo.id} className="overflow-hidden group cursor-pointer hover:shadow-elegant transition-all">
                      <img
                        src={photo.url}
                        alt={photo.title || 'Foto'}
                        className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {photo.title && (
                        <CardContent className="p-3">
                          <p className="text-sm font-medium line-clamp-1">{photo.title}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-border/50 bg-card/30">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay fotos disponibles</p>
                </Card>
              )}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              {loadingGallery ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-lg" />
                  ))}
                </div>
              ) : videos.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden group">
                      <div className="relative aspect-video bg-muted">
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      {video.title && (
                        <CardContent className="p-4">
                          <p className="font-medium line-clamp-2">{video.title}</p>
                          {video.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {video.description}
                            </p>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-border/50 bg-card/30">
                  <VideoIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay videos disponibles</p>
                </Card>
              )}
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio" className="space-y-4">
              {loadingAudio ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : audioPlaylist.length > 0 ? (
                <div className="space-y-3">
                  {audioPlaylist.map((track, index) => (
                    <Card key={track.id} className="border-border/50 bg-card/50 hover:bg-card/70 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{track.title}</p>
                            {track.duration && (
                              <p className="text-sm text-muted-foreground">
                                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                              </p>
                            )}
                          </div>
                          <audio src={track.audio_url} controls className="max-w-xs" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-border/50 bg-card/30">
                  <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay pistas de audio disponibles</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Recent Ratings */}
          {recentRatings.length > 0 && (
            <Card className="mt-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Valoraciones Recientes</h2>
                <div className="space-y-4">
                  {recentRatings.map((rating: any) => (
                    <div key={rating.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0">
                      <img
                        src={rating.rater?.avatar_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=50&h=50&fit=crop"}
                        alt={rating.rater?.name || 'Usuario'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{rating.rater?.name || 'Usuario'}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-muted-foreground">{rating.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

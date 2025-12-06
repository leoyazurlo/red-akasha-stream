import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft,
  Instagram, 
  Facebook, 
  Linkedin,
  Star,
  Share2,
  Copy,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Music2,
  Video,
  Image as ImageIcon,
  UserPlus
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "Agrupación Musical",
  sala_concierto: "Sala de Concierto",
  estudio_grabacion: "Estudio de Grabación",
  productor_artistico: "Productor Artístico",
  promotor_artistico: "Promotor Artístico",
  productor_audiovisual: "Productor Audiovisual",
  musico: "Músico",
  dj: "DJ",
  vj: "VJ",
  sello_discografico: "Sello Discográfico",
  management: "Management",
  representante: "Representante",
  marketing_digital: "Marketing Digital",
  contenido: "Creador de Contenido",
  arte_digital: "Arte Digital",
  percusion: "Percusión",
  danza: "Danza",
  melomano: "Melómano"
};

interface GalleryItem {
  id: string;
  url: string;
  title: string | null;
  media_type: string;
  order_index: number;
}

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  duration: number | null;
  order_index: number;
}

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [copied, setCopied] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [audioPlaylist, setAudioPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const profileUrl = `${window.location.origin}/circuito/perfil/${id}`;

  // Fetch profile from profile_details
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_details")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      fetchGallery();
      fetchAudioPlaylist();
      fetchRatings();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchUserRating();
    }
  }, [user, id]);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_galleries')
        .select('*')
        .eq('profile_id', id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setGallery(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const fetchAudioPlaylist = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_playlist')
        .select('*')
        .eq('profile_id', id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setAudioPlaylist(data || []);
    } catch (error) {
      console.error('Error fetching audio playlist:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data: ratingsData, error } = await supabase
        .from('profile_ratings')
        .select('rating')
        .eq('rated_profile_id', id);

      if (error) throw error;
      
      if (ratingsData && ratingsData.length > 0) {
        const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(sum / ratingsData.length);
        setTotalRatings(ratingsData.length);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchUserRating = async () => {
    try {
      const { data: userProfileData } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!userProfileData) return;

      const { data, error } = await supabase
        .from('profile_ratings')
        .select('rating')
        .eq('rated_profile_id', id)
        .eq('rater_profile_id', userProfileData.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUserRating(data.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión para valorar",
        description: "Necesitas ser socio para valorar perfiles",
      });
      return;
    }

    try {
      const { data: userProfileData } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfileData) {
        toast({
          title: "Crea tu perfil primero",
          description: "Necesitas tener un perfil para valorar",
          variant: "destructive"
        });
        return;
      }

      if (userProfileData.id === id) {
        toast({
          title: "No permitido",
          description: "No puedes valorar tu propio perfil",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profile_ratings')
        .upsert({
          rated_profile_id: id,
          rater_profile_id: userProfileData.id,
          rating: rating
        }, {
          onConflict: 'rated_profile_id,rater_profile_id'
        });

      if (error) throw error;

      setUserRating(rating);
      fetchRatings();
      
      toast({
        title: "Valoración guardada",
        description: `Has valorado este perfil con ${rating} estrellas`
      });
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la valoración",
        variant: "destructive"
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace del perfil se ha copiado al portapapeles"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profile?.display_name} en Red Akasha`,
          text: `Mira el perfil de ${profile?.display_name} en Red Akasha - La red de música latinoamericana`,
          url: profileUrl
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const photos = gallery.filter(item => item.media_type === 'photo' || item.media_type === 'image');
  const videos = gallery.filter(item => item.media_type === 'video');

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (currentTrack < audioPlaylist.length - 1) {
      setCurrentTrack(currentTrack + 1);
    } else {
      setCurrentTrack(0);
    }
  };

  const playPrevious = () => {
    if (currentTrack > 0) {
      setCurrentTrack(currentTrack - 1);
    } else {
      setCurrentTrack(audioPlaylist.length - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current && audioPlaylist.length > 0) {
      audioRef.current.src = audioPlaylist[currentTrack]?.audio_url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack, audioPlaylist]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Perfil no encontrado</h1>
            <p className="text-muted-foreground mb-6">Este perfil no existe o ha sido eliminado.</p>
            <Button onClick={() => navigate("/circuito")}>Ver Circuito</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasContent = photos.length > 0 || videos.length > 0 || audioPlaylist.length > 0;
  const hasSocialMedia = profile.instagram || profile.facebook || profile.linkedin;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/circuito")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Circuito
          </Button>

          {/* Profile Card */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-glow opacity-20 pointer-events-none" />
            
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-glow">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                    {profile.display_name?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <Badge className="mb-3 px-3 py-1 bg-primary/20 text-primary border-primary/30">
                    {profileTypeLabels[profile.profile_type] || profile.profile_type}
                  </Badge>
                  
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                    {profile.display_name}
                  </h1>
                  
                  <p className="text-muted-foreground mb-4">
                    {profile.ciudad}, {profile.pais}
                  </p>
                  
                  {profile.bio && (
                    <p className="text-foreground/80 mb-6 leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Rating */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 justify-center md:justify-start">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer transition-all duration-300 hover:scale-110 ${
                            (hoveredStar || userRating) >= star
                              ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                              : averageRating >= star
                              ? 'fill-primary/60 text-primary/60'
                              : 'text-muted-foreground/30 hover:text-primary/40'
                          }`}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => handleRating(star)}
                        />
                      ))}
                    </div>
                    <span className="text-foreground font-bold">
                      {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </span>
                    {totalRatings > 0 && (
                      <span className="text-muted-foreground text-sm">
                        ({totalRatings} {totalRatings !== 1 ? 'valoraciones' : 'valoración'})
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Button onClick={handleShare} variant="outline" className="border-primary/30">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </Button>
                    <Button onClick={handleCopyLink} variant="outline" className="border-primary/30">
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copiado' : 'Copiar enlace'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          {hasSocialMedia && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Redes Sociales</h3>
                <div className="flex flex-wrap gap-4">
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-pink-500 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                      <span>@{profile.instagram.replace('@', '')}</span>
                    </a>
                  )}
                  {profile.facebook && (
                    <a
                      href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-400 transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          {hasContent && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Trabajos Realizados</h3>
                
                {/* Photos */}
                {photos.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Fotos ({photos.length})</span>
                    </div>
                    <div className="relative">
                      <img
                        src={photos[currentPhotoIndex]?.url}
                        alt={photos[currentPhotoIndex]?.title || 'Foto'}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {photos.length > 1 && (
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/50 hover:bg-black/70"
                            onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/50 hover:bg-black/70"
                            onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Videos ({videos.length})</span>
                    </div>
                    <div className="relative">
                      <video
                        src={videos[currentVideoIndex]?.url}
                        controls
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {videos.length > 1 && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/50 hover:bg-black/70 h-8 w-8"
                            onClick={() => setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)}
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/50 hover:bg-black/70 h-8 w-8"
                            onClick={() => setCurrentVideoIndex((prev) => (prev + 1) % videos.length)}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Player */}
                {audioPlaylist.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Music2 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Audio ({audioPlaylist.length} pistas)</span>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3 truncate">
                        {audioPlaylist[currentTrack]?.title}
                      </p>
                      <audio
                        ref={audioRef}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                        onEnded={playNext}
                      />
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground w-10">
                          {formatTime(currentTime)}
                        </span>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {formatTime(duration)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Button size="icon" variant="ghost" onClick={playPrevious}>
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button size="icon" onClick={togglePlayPause} className="bg-primary hover:bg-primary/80">
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={playNext}>
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Call to Action - Join */}
          {!user && (
            <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
              <CardContent className="p-8 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">¿Te gusta lo que ves?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Únete a Red Akasha para conectar con artistas, valorar perfiles, 
                  acceder a contenido exclusivo y ser parte de la comunidad musical latinoamericana.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/80">
                    <Link to="/asociate">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Asociarme ahora
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/auth">
                      Ya tengo cuenta
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicProfile;

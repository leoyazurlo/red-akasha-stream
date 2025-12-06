import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Music2,
  Video,
  Image as ImageIcon,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProfileTechnicalSheetProps {
  profileId: string;
  displayName: string;
  profileType: string;
  bio: string | null;
  avatarUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  email: string | null;
}

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

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater_name: string;
  rater_avatar: string | null;
}

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "AGRUPACIÓN MUSICAL",
  sala_concierto: "SALA DE CONCIERTO",
  estudio_grabacion: "ESTUDIO DE GRABACIÓN",
  productor_artistico: "PRODUCTOR ARTÍSTICO",
  promotor_artistico: "PROMOTOR ARTÍSTICO",
  productor_audiovisual: "PRODUCTOR AUDIOVISUAL"
};

export const ProfileTechnicalSheet = ({
  profileId,
  displayName,
  profileType,
  bio,
  avatarUrl,
  instagram,
  facebook,
  linkedin,
  whatsapp,
  email
}: ProfileTechnicalSheetProps) => {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [audioPlaylist, setAudioPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [photoTransition, setPhotoTransition] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [videoTransition, setVideoTransition] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [interactionCount, setInteractionCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/circuito/perfil/${profileId}`;

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
          title: `Perfil de ${displayName}`,
          text: `Mira el perfil de ${displayName} en Red Akasha`,
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

  useEffect(() => {
    fetchGallery();
    fetchAudioPlaylist();
    fetchInteractionCount();
    fetchRatings();
    if (user) {
      fetchUserRating();
    }
  }, [profileId, user]);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_galleries')
        .select('*')
        .eq('profile_id', profileId)
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
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setAudioPlaylist(data || []);
    } catch (error) {
      console.error('Error fetching audio playlist:', error);
    }
  };

  const fetchInteractionCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profile_interactions')
        .select('*', { count: 'exact', head: true })
        .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);

      if (error) throw error;
      setInteractionCount(count || 0);
    } catch (error) {
      console.error('Error fetching interaction count:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      // Obtener promedio y total
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('profile_ratings')
        .select('rating')
        .eq('rated_profile_id', profileId);

      if (ratingsError) throw ratingsError;
      
      if (ratingsData && ratingsData.length > 0) {
        const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(sum / ratingsData.length);
        setTotalRatings(ratingsData.length);
      }

      // Obtener últimas 5 valoraciones con información del perfil que valoró
      const { data: recentData, error: recentError } = await supabase
        .from('profile_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          rater_profile_id
        `)
        .eq('rated_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      if (recentData && recentData.length > 0) {
        // Obtener información de los perfiles que valoraron
        const raterIds = recentData.map(r => r.rater_profile_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url')
          .in('id', raterIds);

        if (profilesError) throw profilesError;

        // Combinar datos
        const ratingsWithNames = recentData.map(rating => {
          const raterProfile = profilesData?.find(p => p.id === rating.rater_profile_id);
          return {
            id: rating.id,
            rating: rating.rating,
            comment: rating.comment,
            created_at: rating.created_at,
            rater_name: raterProfile?.display_name || 'Usuario desconocido',
            rater_avatar: raterProfile?.avatar_url || null
          };
        });

        setRecentRatings(ratingsWithNames);
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
        .eq('rated_profile_id', profileId)
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
        title: "Debes iniciar sesión",
        description: "Necesitas estar autenticado para valorar perfiles",
        variant: "destructive"
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
          title: "Error",
          description: "No se encontró tu perfil",
          variant: "destructive"
        });
        return;
      }

      if (userProfileData.id === profileId) {
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
          rated_profile_id: profileId,
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

  const photos = gallery.filter(item => item.media_type === 'photo' || item.media_type === 'image');
  const videos = gallery.filter(item => item.media_type === 'video');
  
  // Check if there are any social media links
  const hasSocialMedia = instagram || facebook || linkedin;
  
  // Check if there's any content in trabajos realizados
  const hasContent = photos.length > 0 || videos.length > 0 || audioPlaylist.length > 0;

  const nextPhoto = () => {
    setPhotoTransition('exit');
    setTimeout(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      setPhotoTransition('enter');
      setTimeout(() => setPhotoTransition('idle'), 500);
    }, 300);
  };

  const previousPhoto = () => {
    setPhotoTransition('exit');
    setTimeout(() => {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      setPhotoTransition('enter');
      setTimeout(() => setPhotoTransition('idle'), 500);
    }, 300);
  };

  const nextVideo = () => {
    setVideoTransition('exit');
    setTimeout(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
      setVideoTransition('enter');
      setTimeout(() => setVideoTransition('idle'), 500);
    }, 300);
  };

  const previousVideo = () => {
    setVideoTransition('exit');
    setTimeout(() => {
      setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
      setVideoTransition('enter');
      setTimeout(() => setVideoTransition('idle'), 500);
    }, 300);
  };

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

  return (
    <div className="relative w-full min-h-screen bg-gradient-dark p-4 sm:p-8 overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Main content container */}
      <div className="relative z-10">
        {/* Header Section with Glassmorphism */}
        <div className="backdrop-blur-xl bg-card/40 rounded-3xl border border-primary/20 p-6 sm:p-8 mb-6 shadow-glow hover:shadow-elegant transition-all duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="flex-1 max-w-3xl">
              {/* Badge with profile type */}
              <Badge className="mb-4 px-4 py-1.5 bg-gradient-primary text-primary-foreground font-bold text-xs tracking-widest border-0 shadow-glow">
                {profileTypeLabels[profileType] || profileType}
              </Badge>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent animate-slide-in">
                {displayName.toUpperCase()}
              </h2>
              
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 backdrop-blur-sm">
                {bio || "Sin información cargada, a la espera de que el socio active"}
              </p>
              
              {/* Rating Section with Modern Design */}
              <div className="mt-6 space-y-4 backdrop-blur-sm bg-background/20 rounded-2xl p-4 border border-primary/10">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 sm:w-7 sm:h-7 cursor-pointer transition-all duration-300 hover:scale-110 ${
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground font-bold text-xl">
                      {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </span>
                    {totalRatings > 0 && (
                      <span className="text-muted-foreground text-xs">
                        ({totalRatings} {totalRatings !== 1 ? 'valoraciones' : 'valoración'})
                      </span>
                    )}
                  </div>
                </div>
                {userRating > 0 && (
                  <p className="text-accent text-xs font-medium">
                    ✨ Tu valoración: {userRating} estrellas
                  </p>
                )}

                {/* Recent Ratings */}
                {recentRatings.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-primary/10">
                    <h4 className="text-xs font-bold text-foreground mb-3 tracking-widest uppercase">Últimas Valoraciones</h4>
                    <div className="space-y-2">
                      {recentRatings.map((rating) => (
                        <div key={rating.id} className="backdrop-blur-md bg-card/30 rounded-xl p-3 border border-primary/5 hover:border-primary/20 transition-all duration-300">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10 border-2 border-primary/30 ring-2 ring-primary/10">
                              <AvatarImage src={rating.rater_avatar || ''} />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                                {rating.rater_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-foreground font-semibold text-sm">{rating.rater_name}</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= rating.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground/20'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {rating.comment && (
                                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{rating.comment}</p>
                              )}
                              <span className="text-muted-foreground/70 text-[10px] mt-1 block">
                                {new Date(rating.created_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar with Artistic Design */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-primary rounded-full blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                <Avatar className="relative w-32 h-32 sm:w-40 sm:h-40 border-4 border-primary/30 ring-4 ring-primary/10 shadow-glow">
                  <AvatarImage src={avatarUrl || ''} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl sm:text-6xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Share Button */}
              <Button
                onClick={handleShare}
                variant="outline"
                className="gap-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-300"
              >
                <Share2 className="w-4 h-4" />
                Compartir Perfil
              </Button>
              
              {/* Copy Link Button */}
              <Button
                onClick={handleCopyLink}
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-cyan-400 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar enlace
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Trabajos Realizados Section - Only show if there's content */}
        {hasContent && (
          <div className="backdrop-blur-xl bg-card/40 rounded-3xl border border-primary/20 p-6 sm:p-8 mb-6 shadow-glow">
            <h3 className="text-2xl sm:text-3xl font-black text-center mb-8 tracking-tight bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
              TRABAJOS REALIZADOS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FOTOS - Only show if there are photos */}
              {photos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-foreground text-center tracking-widest uppercase flex items-center justify-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Fotos
                  </h4>
                  <div className="relative group">
                    {/* Glow effect border */}
                    <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                    
                    <div className="relative aspect-video bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary/20">
                      <img 
                        src={photos[currentPhotoIndex].url} 
                        alt={photos[currentPhotoIndex].title || 'Gallery'} 
                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                          photoTransition === 'exit' 
                            ? 'opacity-0 scale-95 -translate-x-10' 
                            : photoTransition === 'enter' 
                            ? 'opacity-0 scale-95 translate-x-10 animate-photo-enter' 
                            : 'opacity-100 scale-100 translate-x-0'
                        }`}
                      />
                      
                      {/* Navigation arrows */}
                      {photos.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={previousPhoto}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-md hover:bg-primary/80 text-foreground hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 border border-primary/20"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextPhoto}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-md hover:bg-primary/80 text-foreground hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 border border-primary/20"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                          
                          {/* Photo counter */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md px-4 py-1.5 rounded-full text-primary text-xs font-bold border border-primary/20 shadow-lg">
                            {currentPhotoIndex + 1} / {photos.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIDEO - Only show if there are videos */}
              {videos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-foreground text-center tracking-widest uppercase flex items-center justify-center gap-2">
                    <Video className="w-5 h-5 text-accent" />
                    Video
                  </h4>
                  <div className="relative group">
                    {/* Glow effect border */}
                    <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                    
                    <div className="relative aspect-video bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary/20">
                      <video 
                        key={videos[currentVideoIndex].url}
                        controls 
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          videoTransition === 'exit' 
                            ? 'opacity-0 scale-95' 
                            : videoTransition === 'enter' 
                            ? 'opacity-0 scale-95 animate-video-enter' 
                            : 'opacity-100 scale-100'
                        }`}
                      >
                        <source src={videos[currentVideoIndex].url} type="video/mp4" />
                      </video>
                      
                      {/* Navigation arrows */}
                      {videos.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={previousVideo}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-md hover:bg-primary/80 text-foreground hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 border border-primary/20 z-10"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextVideo}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-md hover:bg-primary/80 text-foreground hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 border border-primary/20 z-10"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                          
                          {/* Video counter */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md px-4 py-1.5 rounded-full text-primary text-xs font-bold border border-primary/20 shadow-lg z-10">
                            {currentVideoIndex + 1} / {videos.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO - Only show if there's audio */}
              {audioPlaylist.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-foreground text-center tracking-widest uppercase flex items-center justify-center gap-2">
                    <Music2 className="w-5 h-5 text-primary-glow" />
                    Audio
                  </h4>
                  <div className="backdrop-blur-md bg-card/30 rounded-2xl p-4 border border-primary/20 space-y-4">
                    {/* Playlist */}
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {audioPlaylist.map((track, index) => (
                        <div
                          key={track.id}
                          onClick={() => setCurrentTrack(index)}
                          className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-300 ${
                            currentTrack === index 
                              ? 'bg-primary/20 border border-primary/40 shadow-glow' 
                              : 'hover:bg-card/50 border border-transparent'
                          }`}
                        >
                          <span className={`font-bold text-base min-w-[24px] ${
                            currentTrack === index ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`flex-1 font-semibold text-sm ${
                            currentTrack === index ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {track.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Audio Player */}
                    <audio
                      ref={audioRef}
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                      onEnded={playNext}
                    />

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => {
                          const newTime = parseFloat(e.target.value);
                          setCurrentTime(newTime);
                          if (audioRef.current) {
                            audioRef.current.currentTime = newTime;
                          }
                        }}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
                      />
                      <div className="flex justify-between text-muted-foreground text-xs font-semibold">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {}}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Repeat className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={playPrevious}
                        className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <SkipBack className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayPause}
                        className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 hover:scale-105"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={playNext}
                        className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <SkipForward className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Music2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact & Social Section - Show if there's social media, otherwise just show interaction badge */}
        <div className="backdrop-blur-xl bg-card/40 rounded-3xl border border-primary/20 p-6 sm:p-8 shadow-glow">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {hasSocialMedia && (
              <div className="w-full sm:w-auto">
                <h4 className="text-xl font-bold text-foreground mb-4 tracking-widest uppercase text-center sm:text-left">Contacto</h4>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  {instagram && (
                    <a
                      href={`https://instagram.com/${instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-3 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl p-0.5">
                        <div className="bg-background rounded-lg p-2">
                          <Instagram className="w-6 h-6 text-pink-500" />
                        </div>
                      </div>
                    </a>
                  )}
                  {facebook && (
                    <a
                      href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-3 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-blue-500 rounded-xl p-0.5">
                        <div className="bg-background rounded-lg p-2">
                          <Facebook className="w-6 h-6 text-blue-500" />
                        </div>
                      </div>
                    </a>
                  )}
                  {linkedin && (
                    <a
                      href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-3 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <div className="absolute inset-0 bg-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-blue-600 rounded-xl p-0.5">
                        <div className="bg-background rounded-lg p-2">
                          <Linkedin className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            <Badge className={`px-6 py-3 bg-gradient-primary text-primary-foreground text-sm font-bold tracking-wider border-0 shadow-glow hover:shadow-elegant transition-all duration-300 whitespace-nowrap ${!hasSocialMedia ? 'mx-auto' : ''}`}>
              ✨ Interacciones: {interactionCount}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

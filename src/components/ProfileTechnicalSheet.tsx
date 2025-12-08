import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Check,
  MessageCircle,
  Twitter,
  Maximize2,
  X,
  Send,
  UserPlus,
  UserCheck,
  Mail
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { useFollow } from "@/hooks/useFollow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  const { openMiniPlayer } = useMiniPlayer();
  const [expandedPhoto, setExpandedPhoto] = useState<number | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Get the user_id for following functionality
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const { isFollowing, isLoading: followLoading, toggleFollow, followersCount } = useFollow(targetUserId);

  // Fetch the user_id from profile_details
  useEffect(() => {
    const fetchTargetUserId = async () => {
      const { data } = await supabase
        .from('profile_details')
        .select('user_id')
        .eq('id', profileId)
        .single();
      
      if (data) {
        setTargetUserId(data.user_id);
      }
    };
    
    if (profileId) {
      fetchTargetUserId();
    }
  }, [profileId]);

  // Send direct message
  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para enviar mensajes",
        variant: "destructive",
      });
      return;
    }

    if (!targetUserId || !messageText.trim()) {
      toast({
        title: "Error",
        description: "Escribe un mensaje antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: "Error",
        description: "No puedes enviarte mensajes a ti mismo",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          message: messageText.trim(),
        });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: `Tu mensaje fue enviado a ${displayName}`,
      });
      setMessageText("");
      setShowMessageDialog(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Send to floating mini player
  const sendToMiniPlayer = () => {
    if (audioPlaylist.length === 0) return;
    
    // Pause local audio first
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    
    openMiniPlayer({
      id: profileId,
      title: audioPlaylist[currentTrack]?.title || displayName,
      video_url: null,
      audio_url: audioPlaylist[currentTrack]?.audio_url || null,
      thumbnail_url: avatarUrl,
      content_type: 'profile_audio',
      band_name: displayName,
      playlist: audioPlaylist.map(track => ({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        duration: track.duration
      })),
      currentTrackIndex: currentTrack,
      profileName: displayName,
      profileAvatar: avatarUrl || undefined
    });

    toast({
      title: "Reproductor flotante activado",
      description: "La música seguirá reproduciéndose mientras navegas"
    });
  };

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

  const shareText = `Somos RedAkasha.org te comparte este perfil para que puedas disfrutar del contenido de ${displayName}. Si te gusta, podés asociarte a la Red Akasha.`;

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`;
    window.open(url, "_blank");
    toast({
      title: "Compartiendo en WhatsApp",
      description: "Se abrió WhatsApp para compartir"
    });
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    toast({
      title: "Compartiendo en Facebook",
      description: "Se abrió Facebook para compartir"
    });
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    toast({
      title: "Compartiendo en Twitter",
      description: "Se abrió Twitter para compartir"
    });
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    toast({
      title: "Compartiendo en LinkedIn",
      description: "Se abrió LinkedIn para compartir"
    });
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    toast({
      title: "Compartiendo en Telegram",
      description: "Se abrió Telegram para compartir"
    });
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
  
  // Check if there are any social media links or whatsapp
  const hasSocialMedia = instagram || facebook || linkedin || whatsapp;
  
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
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/30" />
                <span className="text-foreground/70 text-base sm:text-lg font-light tracking-[0.4em] uppercase">
                  {profileTypeLabels[profileType] || profileType}
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/30" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-light text-cyan-400 mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                {displayName}
              </h2>
              
              {/* Rating Stars - Clickable */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          star <= (hoveredStar || userRating || Math.round(averageRating))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {totalRatings > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({totalRatings})
                  </span>
                )}
                {userRating > 0 && (
                  <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-400">
                    Tu valoración: {userRating}★
                  </Badge>
                )}
              </div>

              {/* Follow and Message Buttons - Show for any visitor viewing another's profile */}
              {targetUserId && (!user || user.id !== targetUserId) && (
                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Inicia sesión",
                          description: "Debes iniciar sesión para seguir usuarios",
                          variant: "destructive",
                        });
                        return;
                      }
                      toggleFollow();
                    }}
                    disabled={followLoading}
                    className={`gap-2 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.5)] ${isFollowing 
                      ? 'bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 hover:shadow-[0_0_25px_rgba(34,211,238,0.7)]' 
                      : 'bg-cyan-400 hover:bg-cyan-300 text-black hover:shadow-[0_0_25px_rgba(34,211,238,0.8)]'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Siguiendo
                        {followersCount > 0 && <span className="text-xs opacity-70">({followersCount})</span>}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Seguir
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Inicia sesión",
                          description: "Debes iniciar sesión para enviar mensajes",
                          variant: "destructive",
                        });
                        return;
                      }
                      setShowMessageDialog(true);
                    }}
                    className="gap-2 font-semibold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.7)]"
                  >
                    <Mail className="h-4 w-4" />
                    Mensaje
                  </Button>
                </div>
              )}
              
              <p className="text-muted-foreground/80 text-sm leading-relaxed mb-5 font-light max-w-xl">
                {bio || "Sin información cargada, a la espera de que el socio active"}
              </p>
              
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
              
              {/* Share Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-300"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir Perfil
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-card border-primary/20">
                  <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                    Compartir en WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
                    <Facebook className="h-4 w-4 mr-2 text-blue-500" />
                    Compartir en Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
                    <Twitter className="h-4 w-4 mr-2 text-sky-400" />
                    Compartir en Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareToLinkedIn} className="cursor-pointer">
                    <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                    Compartir en LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareToTelegram} className="cursor-pointer">
                    <Send className="h-4 w-4 mr-2 text-sky-500" />
                    Compartir en Telegram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        ¡Enlace copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar enlace
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Trabajos Realizados Section - Only show if there's content */}
        {hasContent && (
          <div className="backdrop-blur-xl bg-card/40 rounded-3xl border border-primary/20 p-6 sm:p-8 mb-6 shadow-glow">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-primary/30" />
              <h3 className="text-base sm:text-lg font-light text-foreground/70 tracking-[0.4em] uppercase">
                Portfolio
              </h3>
              <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FOTOS - Only show if there are photos */}
              {photos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center">
                    <ImageIcon className="w-5 h-5 text-primary/60" />
                    <span className="text-base font-light text-foreground/60 tracking-[0.2em] uppercase">Galería</span>
                  </div>
                  
                  {/* Photo Carousel */}
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
                      
                      {/* Expand button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedPhoto(currentPhotoIndex)}
                        className="absolute top-2 right-2 bg-background/90 backdrop-blur-md hover:bg-primary/80 text-foreground hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 border border-primary/20"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                      
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
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnail strip */}
                    {photos.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 justify-center">
                        {photos.map((photo, index) => (
                          <button
                            key={photo.id}
                            onClick={() => {
                              setPhotoTransition('exit');
                              setTimeout(() => {
                                setCurrentPhotoIndex(index);
                                setPhotoTransition('enter');
                                setTimeout(() => setPhotoTransition('idle'), 500);
                              }, 300);
                            }}
                            className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                              currentPhotoIndex === index 
                                ? 'border-primary shadow-glow scale-110' 
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img 
                              src={photo.url} 
                              alt={photo.title || `Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIDEOS - Only show if there are videos */}
              {videos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center">
                    <Video className="w-5 h-5 text-accent/60" />
                    <span className="text-base font-light text-foreground/60 tracking-[0.2em] uppercase">Videos</span>
                  </div>
                  
                  {/* Video Carousel */}
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
                      
                      {/* Expand button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedVideo(currentVideoIndex)}
                        className="absolute top-2 right-2 bg-background/90 backdrop-blur-md hover:bg-primary/80 text-foreground hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 border border-primary/20 z-10"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                      
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
                        </>
                      )}
                    </div>
                    
                    {/* Video thumbnail strip */}
                    {videos.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 justify-center">
                        {videos.map((video, index) => (
                          <button
                            key={video.id}
                            onClick={() => {
                              setVideoTransition('exit');
                              setTimeout(() => {
                                setCurrentVideoIndex(index);
                                setVideoTransition('enter');
                                setTimeout(() => setVideoTransition('idle'), 500);
                              }, 300);
                            }}
                            className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 relative ${
                              currentVideoIndex === index 
                                ? 'border-accent shadow-glow scale-110' 
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                              <Play className="w-4 h-4 text-accent" />
                            </div>
                            <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[8px] text-center truncate px-1">
                              {index + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AUDIO - Only show if there's audio */}
              {audioPlaylist.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center">
                    <Music2 className="w-5 h-5 text-primary/60" />
                    <span className="text-base font-light text-foreground/60 tracking-[0.2em] uppercase">Música</span>
                  </div>
                  <div className="backdrop-blur-md bg-card/20 rounded-2xl p-4 border border-primary/10 space-y-3">
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
                        onClick={sendToMiniPlayer}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Reproductor flotante"
                      >
                        <ExternalLink className="w-4 h-4" />
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
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                  <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-primary/30" />
                  <h4 className="text-base sm:text-lg font-light text-foreground/70 tracking-[0.4em] uppercase">
                    Contacto
                  </h4>
                  <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-primary/30" />
                </div>
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
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, '').replace(/^\+/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-3 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <div className="absolute inset-0 bg-green-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-green-500 rounded-xl p-0.5">
                        <div className="bg-background rounded-lg p-2">
                          <MessageCircle className="w-6 h-6 text-green-500" />
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

      {/* Expanded Photo Modal */}
      {expandedPhoto !== null && photos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpandedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
          >
            <X className="w-8 h-8" />
          </Button>

          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedPhoto((prev) => prev !== null ? (prev - 1 + photos.length) % photos.length : 0);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white z-50"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedPhoto((prev) => prev !== null ? (prev + 1) % photos.length : 0);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white z-50"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          <img 
            src={photos[expandedPhoto].url} 
            alt={photos[expandedPhoto].title || 'Foto ampliada'} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm font-medium">
            {expandedPhoto + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* Expanded Video Modal */}
      {expandedVideo !== null && videos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setExpandedVideo(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpandedVideo(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
          >
            <X className="w-8 h-8" />
          </Button>

          {videos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedVideo((prev) => prev !== null ? (prev - 1 + videos.length) % videos.length : 0);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white z-50"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedVideo((prev) => prev !== null ? (prev + 1) % videos.length : 0);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white z-50"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          <video 
            key={videos[expandedVideo].url}
            controls 
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <source src={videos[expandedVideo].url} type="video/mp4" />
          </video>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm font-medium">
            {expandedVideo + 1} / {videos.length}
          </div>
        </div>
      )}

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md" showControls={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={avatarUrl || ''} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>Enviar mensaje a {displayName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Escribe tu mensaje..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {messageText.length}/1000
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMessageDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageText.trim()}
                  className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                >
                  <Send className="h-4 w-4" />
                  {sendingMessage ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

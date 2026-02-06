import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ProfilePaidContent } from "@/components/profile/ProfilePaidContent";
import { FollowButton } from "@/components/profile/FollowButton";
import { SendMessageButton } from "@/components/profile/SendMessageButton";
import { FollowStats } from "@/components/profile/FollowStats";
import { FollowersList } from "@/components/profile/FollowersList";
import { useFollow } from "@/hooks/useFollow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  UserPlus,
  MessageCircle,
  Twitter,
  Send
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

  // Fetch profile first to get user_id for follow hook
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

  // Use follow hook with profile's user_id
  // Use follow hook with profile's user_id
  const { followersCount, followingCount } = useFollow(profile?.user_id || null);

  const profileUrl = `${window.location.origin}/circuito/perfil/${id}`;

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

  const profileTypeLabel = profileTypeLabels[profile?.profile_type || ''] || profile?.profile_type || '';
  const shareText = `Mirá el perfil de ${profileTypeLabel} de ${profile?.display_name} en Red Akasha. ${profile?.ciudad}, ${profile?.pais}. ¡Descubrí su contenido!`;

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
                  {/* Profile types - Principal + Secondary */}
                  <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                    <Badge className="px-3 py-1 bg-primary/20 text-primary border-primary/30">
                      {profileTypeLabels[profile.profile_type] || profile.profile_type}
                    </Badge>
                    {profile.additional_profile_types?.map((type: string) => (
                      <Badge 
                        key={type} 
                        variant="outline" 
                        className="px-3 py-1 border-primary/30 text-primary/80"
                      >
                        {profileTypeLabels[type] || type}
                      </Badge>
                    ))}
                  </div>
                  
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

                  {/* Followers Stats - clickable for logged in users */}
                  <div className="flex flex-wrap gap-6 mb-6 justify-center md:justify-start text-sm">
                    <FollowersList 
                      userId={profile.user_id} 
                      followersCount={followersCount} 
                      isLoggedIn={!!user} 
                    />
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-primary">{followingCount}</span>
                      <span className="text-muted-foreground">Siguiendo</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {/* Follow Button - usando el user_id del perfil */}
                    <FollowButton userId={profile.user_id} currentUserId={user?.id} />
                    
                    {/* Send Message Button */}
                    <SendMessageButton 
                      receiverId={profile.user_id} 
                      receiverName={profile.display_name}
                      receiverAvatar={profile.avatar_url}
                      currentUserId={user?.id}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/20 hover:text-accent hover:border-accent">
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 bg-card border-primary/20">
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

          {/* Paid Content Section */}
          <div className="mb-8">
            <ProfilePaidContent profileId={id!} userId={profile.user_id} />
          </div>

          {/* Gallery */}
          {hasContent && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/30">
              <CardContent className="p-6">
                <h3 className="text-base font-light tracking-wide text-foreground/90 mb-6">Trabajos Realizados</h3>
                
                {/* Photos */}
                {photos.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-8">
                      <ImageIcon className="w-8 h-8 text-cyan-400" />
                      <span className="text-2xl font-light tracking-widest uppercase text-foreground/80">Fotos ({photos.length})</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="flex items-center gap-4">
                        {/* Left Arrow - Outside */}
                        {photos.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 flex-shrink-0"
                            onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                          >
                            <ChevronLeft className="w-5 h-5 text-cyan-400" />
                          </Button>
                        )}
                        
                        {/* Main Image */}
                        <div className="w-[480px] flex-shrink-0">
                          <div className="w-[480px] h-[480px] rounded-xl overflow-hidden border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-black/50">
                            <img
                              src={photos[currentPhotoIndex]?.url}
                              alt={photos[currentPhotoIndex]?.title || 'Foto'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Thumbnails below */}
                          {photos.length > 1 && (
                            <div className="flex justify-center gap-3 mt-6 pt-2 overflow-x-auto pb-2">
                              {photos.map((photo, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentPhotoIndex(idx)}
                                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-500 ${
                                    idx === currentPhotoIndex 
                                      ? 'ring-1 ring-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                                      : 'opacity-40 hover:opacity-70 ring-1 ring-white/10'
                                  }`}
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.title || `Foto ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Right Arrow - Outside */}
                        {photos.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 flex-shrink-0"
                            onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                          >
                            <ChevronRight className="w-5 h-5 text-cyan-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-8">
                      <Video className="w-8 h-8 text-cyan-400" />
                      <span className="text-2xl font-light tracking-widest uppercase text-foreground/80">Videos ({videos.length})</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="flex items-center gap-4">
                        {/* Left Arrow - Outside */}
                        {videos.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 flex-shrink-0"
                            onClick={() => setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)}
                          >
                            <ChevronLeft className="w-5 h-5 text-cyan-400" />
                          </Button>
                        )}
                        
                        {/* Main Video */}
                        <div className="w-[480px] flex-shrink-0">
                          <div className="w-[480px] h-[480px] rounded-xl overflow-hidden border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-black/50">
                            <video
                              src={videos[currentVideoIndex]?.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Thumbnails below */}
                          {videos.length > 1 && (
                            <div className="flex justify-center gap-3 mt-6 pt-2 overflow-x-auto pb-2">
                              {videos.map((video, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentVideoIndex(idx)}
                                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-500 relative ${
                                    idx === currentVideoIndex 
                                      ? 'ring-1 ring-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                                      : 'opacity-40 hover:opacity-70 ring-1 ring-white/10'
                                  }`}
                                >
                                  <video
                                    src={video.url}
                                    className="w-full h-full object-cover"
                                    muted
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Video className="w-4 h-4 text-white/80" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Right Arrow - Outside */}
                        {videos.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 flex-shrink-0"
                            onClick={() => setCurrentVideoIndex((prev) => (prev + 1) % videos.length)}
                          >
                            <ChevronRight className="w-5 h-5 text-cyan-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Player */}
                {audioPlaylist.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <Music2 className="w-8 h-8 text-cyan-400" />
                      <span className="text-2xl font-light tracking-widest uppercase text-foreground/80">Audio ({audioPlaylist.length} pistas)</span>
                    </div>
                    <div className="flex justify-center">
                      <div className="flex items-center gap-4">
                        {/* Left Arrow - Outside */}
                        {audioPlaylist.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 flex-shrink-0"
                            onClick={playPrevious}
                          >
                            <ChevronLeft className="w-5 h-5 text-cyan-400" />
                          </Button>
                        )}
                        
                        {/* Main Audio Player */}
                        <div className="w-[480px] flex-shrink-0">
                          <div className="w-[480px] h-[480px] rounded-xl overflow-hidden border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-gradient-to-br from-black/80 via-cyan-950/20 to-black/80 flex flex-col items-center justify-center p-8">
                            <div className="w-32 h-32 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center mb-6">
                              <Music2 className="w-16 h-16 text-cyan-400/60" />
                            </div>
                            <p className="text-lg font-light mb-6 text-center text-foreground/90 tracking-wide font-sans">
                              {audioPlaylist[currentTrack]?.title}
                            </p>
                            <audio
                              ref={audioRef}
                              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                              onEnded={playNext}
                            />
                            <div className="w-full flex items-center gap-3 mb-6">
                              <span className="text-xs text-muted-foreground w-12 font-light font-sans tracking-wide">
                                {formatTime(currentTime)}
                              </span>
                              <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-400 transition-all"
                                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-12 text-right font-light font-sans tracking-wide">
                                {formatTime(duration)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-8">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={playPrevious}
                                className="h-12 w-12 rounded-full hover:bg-cyan-400/10"
                              >
                                <SkipBack className="w-6 h-6 text-foreground/70" />
                              </Button>
                              <Button 
                                size="icon" 
                                onClick={togglePlayPause} 
                                className="h-16 w-16 rounded-full bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/50"
                              >
                                {isPlaying ? <Pause className="w-7 h-7 text-cyan-400" /> : <Play className="w-7 h-7 text-cyan-400 ml-1" />}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={playNext}
                                className="h-12 w-12 rounded-full hover:bg-cyan-400/10"
                              >
                                <SkipForward className="w-6 h-6 text-foreground/70" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Thumbnails below - track list */}
                          {audioPlaylist.length > 1 && (
                            <div className="flex justify-center gap-3 mt-6 pt-2 overflow-x-auto pb-2">
                              {audioPlaylist.map((track, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setCurrentTrack(idx);
                                    if (audioRef.current) {
                                      audioRef.current.src = track.audio_url;
                                      if (isPlaying) {
                                        audioRef.current.play();
                                      }
                                    }
                                  }}
                                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-500 flex items-center justify-center ${
                                    idx === currentTrack 
                                      ? 'ring-1 ring-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] bg-cyan-400/20' 
                                      : 'opacity-40 hover:opacity-70 ring-1 ring-white/10 bg-black/40'
                                  }`}
                                >
                                  <Music2 className="w-6 h-6 text-cyan-400/70" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Right Arrow - Outside */}
                        {audioPlaylist.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm h-10 w-10 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 flex-shrink-0"
                            onClick={playNext}
                          >
                            <ChevronRight className="w-5 h-5 text-cyan-400" />
                          </Button>
                        )}
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

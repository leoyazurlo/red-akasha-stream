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
  Star
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

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "BANDA",
  sala_concierto: "VENUE",
  estudio_grabacion: "ESTUDIO DE GRABACIÓN",
  productor_artistico: "PRODUCTOR",
  promotor_artistico: "PROMOTOR",
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
  const [interactionCount, setInteractionCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      const { data, error } = await supabase
        .from('profile_ratings')
        .select('rating')
        .eq('rated_profile_id', profileId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(sum / data.length);
        setTotalRatings(data.length);
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
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const previousPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const previousVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
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
    <div className="relative w-full min-h-screen bg-[#00D4FF] p-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1 max-w-3xl">
          <h1 className="text-4xl font-black text-black mb-2 tracking-wider">
            {profileTypeLabels[profileType] || profileType}
          </h1>
          <h2 className="text-3xl font-bold text-black mb-6 tracking-[0.4em]">
            {displayName.toUpperCase()}
          </h2>
          <p className="text-black text-base leading-relaxed font-normal">
            {bio || "Sin información cargada, a la espera de que el socio active"}
          </p>
          
          {/* Rating Section */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer transition-all ${
                      (hoveredStar || userRating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : averageRating >= star
                        ? 'fill-gray-400 text-gray-400'
                        : 'text-gray-300'
                    }`}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRating(star)}
                  />
                ))}
              </div>
              <span className="text-black font-semibold">
                {averageRating > 0 ? averageRating.toFixed(1) : 'Sin valoraciones'}
              </span>
              {totalRatings > 0 && (
                <span className="text-black/70 text-sm">
                  ({totalRatings} valoración{totalRatings !== 1 ? 'es' : ''})
                </span>
              )}
            </div>
            {userRating > 0 && (
              <p className="text-black/70 text-sm">
                Tu valoración: {userRating} estrellas
              </p>
            )}
          </div>
        </div>

        {/* Avatar with decorative elements */}
        <div className="relative ml-8">
          <div className="absolute -top-8 -right-4 text-black text-base tracking-[0.3em] font-bold whitespace-nowrap text-right leading-tight">
            F I C H A<br/>T E C N I C A
          </div>
          {/* Decorative background with diagonal lines */}
          <div className="relative flex items-center justify-center">
            <svg className="absolute w-72 h-72" viewBox="0 0 300 300">
              <g stroke="#7DD3C0" strokeWidth="8" fill="none" opacity="0.6">
                <line x1="50" y1="50" x2="110" y2="50" transform="rotate(-45 150 150)" />
                <line x1="60" y1="60" x2="120" y2="60" transform="rotate(-45 150 150)" />
                <line x1="70" y1="70" x2="130" y2="70" transform="rotate(-45 150 150)" />
                <line x1="180" y1="50" x2="240" y2="50" transform="rotate(-45 150 150)" />
                <line x1="190" y1="60" x2="250" y2="60" transform="rotate(-45 150 150)" />
                <line x1="200" y1="70" x2="260" y2="70" transform="rotate(-45 150 150)" />
              </g>
            </svg>
            {/* Círculo decorativo exterior - Ahora centrado */}
            <div className="absolute w-52 h-52 rounded-full bg-gradient-to-br from-[#7DD3C0] to-[#5E9FFF] opacity-40"></div>
            {/* Círculo de borde - Ahora centrado */}
            <div className="absolute w-44 h-44 rounded-full border-4 border-black/80"></div>
            {/* Avatar centrado */}
            <Avatar className="w-40 h-40 border-4 border-black relative z-10">
              <AvatarImage src={avatarUrl || ''} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-6xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Trabajos Realizados Section - Only show if there's content */}
      {hasContent && (
        <div className="mb-8">
          <h3 className="text-3xl font-black text-black text-center mb-8 tracking-wider">
            TRABAJOS REALIZADOS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FOTOS - Only show if there are photos */}
          {photos.length > 0 && (
          <div>
            <h4 className="text-2xl font-black text-black mb-4 text-center tracking-wider">FOTOS</h4>
            <div className="relative group">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-l-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-r-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-4 border-b-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-4 border-b-4 border-[#FF1493] z-20"></div>
              
              <div className="aspect-video bg-background rounded-lg overflow-hidden relative">
                <img 
                  src={photos[currentPhotoIndex].url} 
                  alt={photos[currentPhotoIndex].title || 'Gallery'} 
                  className="w-full h-full object-cover transition-all duration-300" 
                />
                
                {/* Navigation arrows */}
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={previousPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    
                    {/* Photo counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-primary text-sm font-bold">
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
          <div>
            <h4 className="text-2xl font-black text-black mb-4 text-center tracking-wider">VIDEO</h4>
            <div className="relative group">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-l-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-r-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-4 border-b-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-4 border-b-4 border-[#FF1493] z-20"></div>
              
              <div className="aspect-video bg-background rounded-lg overflow-hidden relative">
                <video 
                  key={videos[currentVideoIndex].url}
                  controls 
                  className="w-full h-full object-cover"
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-primary opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextVideo}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-primary opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    
                    {/* Video counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-primary text-sm font-bold z-10">
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
          <div>
            <h4 className="text-2xl font-black text-black mb-4 text-center tracking-wider">AUDIO</h4>
            <div className="space-y-4">
              {/* Playlist */}
              <div className="space-y-2">
                {audioPlaylist.map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => setCurrentTrack(index)}
                    className={`flex items-center gap-2 cursor-pointer p-2 rounded ${
                      currentTrack === index ? 'bg-black/20' : 'hover:bg-black/10'
                    }`}
                  >
                    <span className="text-black font-bold text-lg">{index + 1}</span>
                    <span className="text-black flex-1 font-semibold">{track.title}</span>
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
                  className="w-full accent-black"
                />
                <div className="flex justify-between text-black text-sm font-semibold">
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
                  className="text-black hover:text-black hover:bg-black/10"
                >
                  <Repeat className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playPrevious}
                  className="text-black hover:text-black hover:bg-black/10"
                >
                  <SkipBack className="w-7 h-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="w-16 h-16 rounded-full bg-black text-white hover:bg-black/90"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playNext}
                  className="text-black hover:text-black hover:bg-black/10"
                >
                  <SkipForward className="w-7 h-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black hover:text-black hover:bg-black/10"
                >
                  <Music2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>
        </div>
      )}

      {/* Contact & Social Section - Show if there's social media, otherwise just show interaction badge */}
      <div className="flex items-center justify-between mt-12">
        {hasSocialMedia && (
          <div>
            <h4 className="text-2xl font-black text-black mb-4 tracking-wider">CONTACTO</h4>
            <div className="flex gap-4">
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 rounded-lg transition-opacity"
                >
                  <Instagram className="w-8 h-8 text-white" />
                </a>
              )}
              {facebook && (
                <a
                  href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Facebook className="w-8 h-8 text-white" />
                </a>
              )}
              {linkedin && (
                <a
                  href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <Linkedin className="w-8 h-8 text-white" />
                </a>
              )}
            </div>
          </div>
        )}
        
        <Badge className={`px-8 py-3 bg-gradient-to-r from-orange-400 to-amber-500 text-black text-lg font-black tracking-[0.2em] shadow-lg ${!hasSocialMedia ? 'ml-auto' : ''}`}>
          INTERACCION CON LA COMUNIDAD {interactionCount}
        </Badge>
      </div>
    </div>
  );
};

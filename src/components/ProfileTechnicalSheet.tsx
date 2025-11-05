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
  ChevronRight
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  disfruto_musica: "MUSIC LOVER"
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
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchGallery();
    fetchAudioPlaylist();
  }, [profileId]);

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

  const photos = gallery.filter(item => item.media_type === 'image');
  const videos = gallery.filter(item => item.media_type === 'video');

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
    <div className="relative w-full min-h-screen bg-primary p-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-background mb-2 tracking-wider">
            {profileTypeLabels[profileType] || profileType}
          </h1>
          <h2 className="text-3xl font-bold text-background mb-6 tracking-widest">
            {displayName.toUpperCase()}
          </h2>
          <p className="text-background max-w-2xl text-lg leading-relaxed font-medium">
            {bio || "Sin descripción"}
          </p>
        </div>

        {/* Avatar with decorative elements */}
        <div className="relative">
          <div className="absolute -top-4 -right-4 text-background text-sm tracking-[0.3em] font-bold whitespace-nowrap">
            FICHA<br/>TECNICA
          </div>
          {/* Decorative background */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-glow to-accent blur-2xl opacity-30 rounded-full"></div>
            <svg className="absolute -inset-8 w-64 h-64" viewBox="0 0 200 200">
              <g stroke="hsl(var(--secondary-foreground))" strokeWidth="2" fill="none" opacity="0.3">
                <circle cx="100" cy="100" r="70" />
                <circle cx="100" cy="100" r="80" />
                <circle cx="100" cy="100" r="90" />
                <line x1="30" y1="100" x2="50" y2="100" />
                <line x1="150" y1="100" x2="170" y2="100" />
                <line x1="100" y1="30" x2="100" y2="50" />
                <line x1="100" y1="150" x2="100" y2="170" />
              </g>
            </svg>
            <Avatar className="w-48 h-48 border-4 border-background shadow-glow relative z-10">
              <AvatarImage src={avatarUrl || ''} alt={displayName} />
              <AvatarFallback className="bg-gradient-primary text-background text-6xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Trabajos Realizados Section */}
      <div className="mb-8">
        <h3 className="text-3xl font-black text-background text-center mb-8 tracking-wider">
          TRABAJOS REALIZADOS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FOTOS */}
          <div>
            <h4 className="text-2xl font-black text-background mb-4 text-center tracking-wider">FOTOS</h4>
            <div className="relative group">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-l-4 border-t-4 border-secondary-foreground z-20"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-r-4 border-t-4 border-secondary-foreground z-20"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-4 border-b-4 border-secondary-foreground z-20"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-4 border-b-4 border-secondary-foreground z-20"></div>
              
              <div className="aspect-video bg-background rounded-lg overflow-hidden relative">
                {photos.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VIDEO */}
          <div>
            <h4 className="text-2xl font-black text-background mb-4 text-center tracking-wider">VIDEO</h4>
            <div className="relative group">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-l-4 border-t-4 border-secondary-foreground z-20"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-r-4 border-t-4 border-secondary-foreground z-20"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-4 border-b-4 border-secondary-foreground z-20"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-4 border-b-4 border-secondary-foreground z-20"></div>
              
              <div className="aspect-video bg-background rounded-lg overflow-hidden relative">
                {videos.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Video className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AUDIO */}
          <div>
            <h4 className="text-2xl font-black text-background mb-4 text-center tracking-wider">AUDIO</h4>
            <div className="space-y-4">
              {audioPlaylist.length > 0 ? (
                <>
                  {/* Playlist */}
                  <div className="space-y-2">
                    {audioPlaylist.map((track, index) => (
                      <div
                        key={track.id}
                        onClick={() => setCurrentTrack(index)}
                        className={`flex items-center gap-2 cursor-pointer p-2 rounded ${
                          currentTrack === index ? 'bg-background/20' : 'hover:bg-background/10'
                        }`}
                      >
                        <span className="text-background font-bold">{index + 1}</span>
                        <span className="text-background flex-1">{track.title}</span>
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
                      className="w-full accent-background"
                    />
                    <div className="flex justify-between text-background text-sm">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {}}
                      className="text-background hover:text-background hover:bg-background/10"
                    >
                      <Repeat className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={playPrevious}
                      className="text-background hover:text-background hover:bg-background/10"
                    >
                      <SkipBack className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayPause}
                      className="w-16 h-16 rounded-full bg-background text-primary hover:bg-background/90"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={playNext}
                      className="text-background hover:text-background hover:bg-background/10"
                    >
                      <SkipForward className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-background hover:text-background hover:bg-background/10"
                    >
                      <Music2 className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-background text-center py-8">
                  <Music2 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Sin audio disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Social Section */}
      <div className="flex items-center justify-between mt-12">
        <div>
          <h4 className="text-2xl font-black text-background mb-4 tracking-wider">CONTACTO</h4>
          <div className="flex gap-3">
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-background rounded flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Instagram className="w-6 h-6 text-primary" />
              </a>
            )}
            {facebook && (
              <a
                href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-background rounded flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Facebook className="w-6 h-6 text-primary" />
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-background rounded flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Linkedin className="w-6 h-6 text-primary" />
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-background rounded flex items-center justify-center hover:scale-110 transition-transform"
              >
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        <Badge 
          variant="secondary" 
          className="bg-[#C88B3A] text-background text-xl px-8 py-3 rounded-full font-black tracking-widest hover:bg-[#B07B2A] cursor-default"
        >
          INTERACCION CON LA COMUNIDAD 5
        </Badge>
      </div>
    </div>
  );
};

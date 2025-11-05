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
            {bio || "Sin descripción"}
          </p>
        </div>

        {/* Avatar with decorative elements */}
        <div className="relative ml-8">
          <div className="absolute -top-8 -right-4 text-black text-base tracking-[0.3em] font-bold whitespace-nowrap text-right leading-tight">
            F I C H A<br/>T E C N I C A
          </div>
          {/* Decorative background with diagonal lines */}
          <div className="relative">
            <svg className="absolute -inset-12 w-72 h-72" viewBox="0 0 300 300">
              <g stroke="#7DD3C0" strokeWidth="8" fill="none" opacity="0.6">
                <line x1="20" y1="20" x2="80" y2="20" transform="rotate(-45 50 50)" />
                <line x1="30" y1="30" x2="90" y2="30" transform="rotate(-45 60 60)" />
                <line x1="40" y1="40" x2="100" y2="40" transform="rotate(-45 70 70)" />
                <line x1="50" y1="50" x2="110" y2="50" transform="rotate(-45 80 80)" />
                <line x1="220" y1="20" x2="280" y2="20" transform="rotate(-45 250 50)" />
                <line x1="230" y1="30" x2="290" y2="30" transform="rotate(-45 260 60)" />
                <line x1="240" y1="40" x2="300" y2="40" transform="rotate(-45 270 70)" />
                <line x1="250" y1="50" x2="310" y2="50" transform="rotate(-45 280 80)" />
              </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-44 h-44 rounded-full border-4 border-black/80"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-52 h-52 rounded-full bg-gradient-to-br from-[#7DD3C0] to-[#5E9FFF] opacity-40"></div>
            </div>
            <Avatar className="w-40 h-40 border-4 border-black relative z-10 ml-6 mt-6">
              <AvatarImage src={avatarUrl || ''} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-6xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Trabajos Realizados Section */}
      <div className="mb-8">
        <h3 className="text-3xl font-black text-black text-center mb-8 tracking-wider">
          TRABAJOS REALIZADOS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FOTOS */}
          <div>
            <h4 className="text-2xl font-black text-black mb-4 text-center tracking-wider">FOTOS</h4>
            <div className="relative group">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-l-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-r-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-4 border-b-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-4 border-b-4 border-[#FF1493] z-20"></div>
              
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
            <h4 className="text-2xl font-black text-black mb-4 text-center tracking-wider">VIDEO</h4>
            <div className="relative group">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-l-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-r-4 border-t-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-4 border-b-4 border-[#FF1493] z-20"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-4 border-b-4 border-[#FF1493] z-20"></div>
              
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
            <h4 className="text-2xl font-black text-black mb-4 text-center tracking-wider">AUDIO</h4>
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
                </>
              ) : (
                <div className="text-black text-center py-8">
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
          <h4 className="text-2xl font-black text-black mb-4 tracking-wider">CONTACTO</h4>
          <div className="flex gap-4">
            {/* YouTube */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Youtube className="w-8 h-8 text-white" />
            </a>
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
            {/* Twitch */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
            </a>
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
            {/* TikTok */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-black hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
            {/* X (Twitter) */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-black hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <Badge className="px-8 py-3 bg-gradient-to-r from-orange-400 to-amber-500 text-black text-lg font-black tracking-[0.2em] shadow-lg">
          INTERACCION CON LA COMUNIDAD 5
        </Badge>
      </div>
    </div>
  );
};

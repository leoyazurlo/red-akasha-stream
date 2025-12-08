import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  duration: number | null;
}

interface MiniPlayerContent {
  id: string;
  title: string;
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
  band_name: string | null;
  // For profile audio playlists
  playlist?: AudioTrack[];
  currentTrackIndex?: number;
  profileName?: string;
  profileAvatar?: string;
}

interface MiniPlayerContextType {
  isOpen: boolean;
  content: MiniPlayerContent | null;
  openMiniPlayer: (content: MiniPlayerContent) => void;
  closeMiniPlayer: () => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  // Audio state for global control
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export const MiniPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<MiniPlayerContent | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const openMiniPlayer = (newContent: MiniPlayerContent) => {
    setContent(newContent);
    setIsOpen(true);
    setIsMinimized(false);
    setCurrentTrackIndex(newContent.currentTrackIndex || 0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const closeMiniPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsOpen(false);
    setContent(null);
    setIsMinimized(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentTrackIndex(0);
  };

  // Auto-play when content changes
  useEffect(() => {
    if (audioRef.current && content && isOpen) {
      const audioUrl = content.playlist?.[currentTrackIndex]?.audio_url || content.audio_url;
      if (audioUrl && audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [content, currentTrackIndex, isOpen, isPlaying]);

  return (
    <MiniPlayerContext.Provider
      value={{
        isOpen,
        content,
        openMiniPlayer,
        closeMiniPlayer,
        isMinimized,
        setIsMinimized,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        currentTrackIndex,
        setCurrentTrackIndex,
        audioRef,
      }}
    >
      {children}
      {/* Global audio element that persists across pages */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (content?.playlist && currentTrackIndex < content.playlist.length - 1) {
            setCurrentTrackIndex(currentTrackIndex + 1);
          } else {
            setIsPlaying(false);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </MiniPlayerContext.Provider>
  );
};

export const useMiniPlayer = () => {
  const context = useContext(MiniPlayerContext);
  if (context === undefined) {
    throw new Error('useMiniPlayer must be used within a MiniPlayerProvider');
  }
  return context;
};
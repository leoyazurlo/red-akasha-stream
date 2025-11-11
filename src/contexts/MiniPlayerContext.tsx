import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MiniPlayerContent {
  id: string;
  title: string;
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
  band_name: string | null;
}

interface MiniPlayerContextType {
  isOpen: boolean;
  content: MiniPlayerContent | null;
  openMiniPlayer: (content: MiniPlayerContent) => void;
  closeMiniPlayer: () => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export const MiniPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<MiniPlayerContent | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const openMiniPlayer = (newContent: MiniPlayerContent) => {
    setContent(newContent);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeMiniPlayer = () => {
    setIsOpen(false);
    setContent(null);
    setIsMinimized(false);
  };

  return (
    <MiniPlayerContext.Provider
      value={{
        isOpen,
        content,
        openMiniPlayer,
        closeMiniPlayer,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
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
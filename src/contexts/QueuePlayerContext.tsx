import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';

export interface QueueItem {
  id: string;
  title: string;
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
  band_name: string | null;
  duration: number | null;
}

interface QueuePlayerContextType {
  queue: QueueItem[];
  currentIndex: number;
  isOpen: boolean;
  isPlaying: boolean;
  isExpanded: boolean;
  currentTime: number;
  totalDuration: number;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  setQueue: (items: QueueItem[], startIndex?: number) => void;
  addToQueue: (item: QueueItem) => void;
  playItem: (item: QueueItem) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  closePlayer: () => void;
  setExpanded: (expanded: boolean) => void;
  seekTo: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const QueuePlayerContext = createContext<QueuePlayerContextType | undefined>(undefined);

export const QueuePlayerProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueueState] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = queue[currentIndex] || null;

  const setQueue = useCallback((items: QueueItem[], startIndex = 0) => {
    setQueueState(items);
    setCurrentIndex(startIndex);
    setIsOpen(true);
    setIsPlaying(true);
  }, []);

  const addToQueue = useCallback((item: QueueItem) => {
    setQueueState(prev => {
      if (prev.some(q => q.id === item.id)) return prev;
      return [...prev, item];
    });
    if (!isOpen) {
      setIsOpen(true);
      setIsPlaying(true);
    }
  }, [isOpen]);

  const playItem = useCallback((item: QueueItem) => {
    const idx = queue.findIndex(q => q.id === item.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
    } else {
      setQueueState(prev => [...prev, item]);
      setCurrentIndex(queue.length);
    }
    setIsOpen(true);
    setIsPlaying(true);
  }, [queue]);

  const playNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  }, [currentIndex, queue.length]);

  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
    setIsPlaying(prev => !prev);
  }, []);

  const closePlayer = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setIsOpen(false);
    setIsPlaying(false);
    setQueueState([]);
    setCurrentIndex(0);
    setExpanded(false);
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Load media when current item changes
  useEffect(() => {
    if (!currentItem || !videoRef.current) return;
    const url = currentItem.video_url || currentItem.audio_url;
    if (url) {
      videoRef.current.src = url;
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [currentItem?.id]);

  return (
    <QueuePlayerContext.Provider value={{
      queue,
      currentIndex,
      isOpen,
      isPlaying,
      isExpanded,
      currentTime,
      totalDuration,
      activeCategory,
      setActiveCategory,
      setQueue,
      addToQueue,
      playItem,
      playNext,
      playPrev,
      togglePlay,
      closePlayer,
      setExpanded,
      seekTo,
      videoRef,
    }}>
      {children}
      {/* Global video/audio element */}
      <video
        ref={videoRef}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setTotalDuration(e.currentTarget.duration)}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />
    </QueuePlayerContext.Provider>
  );
};

export const useQueuePlayer = () => {
  const context = useContext(QueuePlayerContext);
  if (!context) throw new Error('useQueuePlayer must be used within QueuePlayerProvider');
  return context;
};

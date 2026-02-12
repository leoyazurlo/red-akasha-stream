import { useCallback } from "react";

interface TrackMeta {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
}

interface MediaSessionControls {
  onPlay?: () => void;
  onPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
}

export const useMediaSession = () => {
  const setupMediaSession = useCallback(
    (track: TrackMeta, controls?: MediaSessionControls) => {
      if (!("mediaSession" in navigator)) return;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist ?? "Red Akasha",
        album: track.album ?? "Red Akasha",
        artwork: track.artwork
          ? [
              { src: track.artwork, sizes: "96x96", type: "image/png" },
              { src: track.artwork, sizes: "256x256", type: "image/png" },
              { src: track.artwork, sizes: "512x512", type: "image/png" },
            ]
          : [],
      });

      const handlers: [MediaSessionAction, (() => void) | undefined][] = [
        ["play", controls?.onPlay],
        ["pause", controls?.onPause],
        ["previoustrack", controls?.onPrevious],
        ["nexttrack", controls?.onNext],
        ["seekbackward", controls?.onSeekBackward],
        ["seekforward", controls?.onSeekForward],
      ];

      handlers.forEach(([action, handler]) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler ?? null);
        } catch {
          // action not supported
        }
      });
    },
    [],
  );

  const updatePlaybackState = useCallback(
    (state: "playing" | "paused" | "none") => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = state;
      }
    },
    [],
  );

  const updatePositionState = useCallback(
    (duration: number, position: number, playbackRate = 1) => {
      if (!("mediaSession" in navigator)) return;
      try {
        navigator.mediaSession.setPositionState({
          duration,
          position: Math.min(position, duration),
          playbackRate,
        });
      } catch {
        // ignore
      }
    },
    [],
  );

  return { setupMediaSession, updatePlaybackState, updatePositionState };
};

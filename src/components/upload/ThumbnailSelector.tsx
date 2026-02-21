import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, Camera, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ThumbnailSelectorProps {
  videoThumbnail: string;
  customThumbnail: string;
  onCustomThumbnailChange: (url: string) => void;
  videoUrl?: string;
}

export const ThumbnailSelector = ({
  videoThumbnail,
  customThumbnail,
  onCustomThumbnailChange,
  videoUrl,
}: ThumbnailSelectorProps) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedFrames, setGeneratedFrames] = useState<string[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [seekTime, setSeekTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPreview, setCurrentPreview] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Auto-generate frames when video is loaded
  const generateAutoFrames = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.duration || video.duration === Infinity) return;

    setIsGenerating(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) { setIsGenerating(false); return; }

    const totalDuration = video.duration;
    const times = [
      totalDuration * 0.05,
      totalDuration * 0.15,
      totalDuration * 0.3,
      totalDuration * 0.5,
      totalDuration * 0.7,
      totalDuration * 0.9,
    ].filter(t => t < totalDuration && t >= 0);

    const frames: string[] = [];

    for (const time of times) {
      try {
        const frame = await captureFrameAt(video, canvas, ctx, time);
        if (frame) frames.push(frame);
      } catch {
        // skip failed frames
      }
    }

    setGeneratedFrames(frames);
    setIsGenerating(false);

    if (frames.length > 0 && !videoThumbnail && !customThumbnail) {
      const middleIdx = Math.floor(frames.length / 2);
      setSelectedFrameIndex(middleIdx);
      onCustomThumbnailChange(frames[middleIdx]);
    }
  }, [videoThumbnail, customThumbnail, onCustomThumbnailChange]);

  const captureFrameAt = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    time: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("timeout"), 8000);
      const onSeeked = () => {
        clearTimeout(timeout);
        video.removeEventListener("seeked", onSeeked);
        try {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          // Check if it's a blank/black frame
          if (dataUrl.length < 1000) {
            reject("blank frame");
          } else {
            resolve(dataUrl);
          }
        } catch {
          reject("canvas error");
        }
      };
      video.addEventListener("seeked", onSeeked, { once: true });
      video.currentTime = time;
    });
  };

  const captureCurrentFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL("image/jpeg", 0.85);
    setCurrentPreview(frame);
    setSelectedFrameIndex(null);
    onCustomThumbnailChange(frame);
  }, [onCustomThumbnailChange]);

  const handleSliderChange = useCallback((value: number[]) => {
    const time = value[0];
    setSeekTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const stepFrame = useCallback((direction: number) => {
    const step = Math.max(0.5, duration * 0.02);
    const newTime = Math.max(0, Math.min(duration, seekTime + step * direction));
    setSeekTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, [seekTime, duration]);

  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && video.duration !== Infinity) {
      setDuration(video.duration);
      setVideoReady(true);
      generateAutoFrames();
    }
  }, [generateAutoFrames]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const effectiveVideoUrl = videoUrl || videoThumbnail;
  const showVideoScrubber = !!effectiveVideoUrl;
  const needsCrossOrigin = effectiveVideoUrl && !effectiveVideoUrl.startsWith("blob:") && !effectiveVideoUrl.startsWith("data:");

  return (
    <div className="border-t pt-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t("upload.customThumbnail")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Elegí el mejor momento de tu video como miniatura, o subí una imagen personalizada.
        </p>
      </div>

      {/* Hidden video + canvas for frame extraction */}
      {showVideoScrubber && (
        <>
          <canvas ref={canvasRef} className="hidden" />
          <video
            ref={videoRef}
            src={effectiveVideoUrl}
            crossOrigin={needsCrossOrigin ? "anonymous" : undefined}
            preload="auto"
            muted
            playsInline
            className="hidden"
            onLoadedData={handleVideoLoaded}
            onLoadedMetadata={handleVideoLoaded}
          />
        </>
      )}

      {/* Video scrubber for frame selection */}
      {showVideoScrubber && videoReady && (
        <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-card/50">
          <p className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Seleccioná el frame del video
          </p>

          {/* Live preview of current frame */}
          {currentPreview && (
            <div className="aspect-video max-w-sm rounded-lg overflow-hidden border border-primary/30 mx-auto">
              <img src={currentPreview} alt="Frame seleccionado" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Slider + controls */}
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => stepFrame(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Slider
                value={[seekTime]}
                min={0}
                max={duration || 1}
                step={0.1}
                onValueChange={handleSliderChange}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => stepFrame(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatTime(seekTime)} / {formatTime(duration)}</span>
            <Button type="button" variant="outline" size="sm" onClick={captureCurrentFrame} className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Capturar este cuadro
            </Button>
          </div>

          {/* Auto-generated frame suggestions */}
          {generatedFrames.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Sugerencias automáticas:</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {generatedFrames.map((frame, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedFrameIndex(idx);
                      setCurrentPreview(frame);
                      onCustomThumbnailChange(frame);
                    }}
                    className={`aspect-video rounded-md overflow-hidden border-2 transition-all hover:opacity-100 ${
                      selectedFrameIndex === idx
                        ? "border-primary ring-2 ring-primary/30 opacity-100"
                        : "border-border/50 opacity-70"
                    }`}
                  >
                    <img src={frame} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <p className="text-xs text-muted-foreground animate-pulse">Generando sugerencias de miniatura...</p>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={generateAutoFrames}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Regenerar sugerencias
          </Button>
        </div>
      )}

      {/* Existing thumbnail options */}
      <div className="grid grid-cols-2 gap-4">
        {videoThumbnail && (
          <div
            className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
              !customThumbnail
                ? "border-cyan-400 ring-2 ring-cyan-400/30"
                : "border-border hover:border-muted-foreground"
            }`}
            onClick={() => {
              onCustomThumbnailChange("");
              setSelectedFrameIndex(null);
              setCurrentPreview("");
            }}
          >
            <div className="aspect-video">
              <img src={videoThumbnail} alt={t("upload.videoFrame")} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
              <p className="text-xs text-white text-center">{t("upload.videoFrame")}</p>
            </div>
            {!customThumbnail && (
              <div className="absolute top-2 right-2 bg-cyan-400 text-black text-xs px-2 py-1 rounded font-semibold">
                {t("upload.selected")}
              </div>
            )}
          </div>
        )}

        <div
          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
            customThumbnail
              ? "border-cyan-400 ring-2 ring-cyan-400/30"
              : "border-dashed border-border"
          }`}
        >
          {customThumbnail ? (
            <>
              <div className="aspect-video">
                <img src={customThumbnail} alt={t("upload.customThumbnailLabel")} className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                <p className="text-xs text-white text-center">{t("upload.customThumbnailLabel")}</p>
              </div>
              <div className="absolute top-2 right-2 bg-cyan-400 text-black text-xs px-2 py-1 rounded font-semibold">
                {t("upload.selected")}
              </div>
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center bg-card/50 p-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center">{t("upload.uploadThumbnail")}</p>
            </div>
          )}
        </div>
      </div>

      <ImageUpload
        label={t("upload.uploadCustomThumbnail")}
        value={customThumbnail}
        onChange={onCustomThumbnailChange}
        description={t("upload.thumbnailDesc")}
      />
    </div>
  );
};

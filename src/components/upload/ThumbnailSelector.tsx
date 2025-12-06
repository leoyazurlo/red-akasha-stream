import { useTranslation } from "react-i18next";
import { ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface ThumbnailSelectorProps {
  videoThumbnail: string;
  customThumbnail: string;
  onCustomThumbnailChange: (url: string) => void;
}

export const ThumbnailSelector = ({
  videoThumbnail,
  customThumbnail,
  onCustomThumbnailChange,
}: ThumbnailSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="border-t pt-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.customThumbnail')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('upload.customThumbnailDesc')}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {videoThumbnail && (
          <div 
            className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
              !customThumbnail 
                ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                : 'border-border hover:border-muted-foreground'
            }`}
            onClick={() => onCustomThumbnailChange("")}
          >
            <div className="aspect-video">
              <img 
                src={videoThumbnail} 
                alt={t('upload.videoFrame')} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
              <p className="text-xs text-white text-center">{t('upload.videoFrame')}</p>
            </div>
            {!customThumbnail && (
              <div className="absolute top-2 right-2 bg-cyan-400 text-black text-xs px-2 py-1 rounded font-semibold">
                {t('upload.selected')}
              </div>
            )}
          </div>
        )}
        
        <div 
          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
            customThumbnail 
              ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
              : 'border-dashed border-border'
          }`}
        >
          {customThumbnail ? (
            <>
              <div className="aspect-video">
                <img 
                  src={customThumbnail} 
                  alt={t('upload.customThumbnailLabel')} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                <p className="text-xs text-white text-center">{t('upload.customThumbnailLabel')}</p>
              </div>
              <div className="absolute top-2 right-2 bg-cyan-400 text-black text-xs px-2 py-1 rounded font-semibold">
                {t('upload.selected')}
              </div>
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center bg-card/50 p-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center">{t('upload.uploadThumbnail')}</p>
            </div>
          )}
        </div>
      </div>

      <ImageUpload
        label={t('upload.uploadCustomThumbnail')}
        value={customThumbnail}
        onChange={onCustomThumbnailChange}
        description={t('upload.thumbnailDesc')}
      />
    </div>
  );
};

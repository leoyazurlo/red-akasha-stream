import { Button } from "@/components/ui/button";
import { Share2, Link, MessageCircle } from "lucide-react";
import { notifySuccess } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AudioShareButtonProps {
  trackId: string;
  title: string;
  artist?: string | null;
}

export const AudioShareButton = ({ trackId, title, artist }: AudioShareButtonProps) => {
  const shareUrl = `${window.location.origin}/video/${trackId}`;
  const shareText = `🎵 ${title}${artist ? ` — ${artist}` : ""} en Red Akasha`;

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl);
    notifySuccess("Link copiado", "El enlace se copió al portapapeles");
  };

  const shareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  const shareTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground/50 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={copyLink}>
          <Link className="h-4 w-4 mr-2" />
          Copiar link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTelegram}>
          <Share2 className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTwitter}>
          <Share2 className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import logoAkasha from "@/assets/logo-akasha.png";

export const VideoWatermark = () => (
  <div className="absolute top-3 right-3 z-20 pointer-events-none">
    <img
      src={logoAkasha}
      alt="Akasha"
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full animate-spin-slow opacity-80 drop-shadow-[0_0_6px_hsl(180_100%_50%/0.6)]"
    />
  </div>
);

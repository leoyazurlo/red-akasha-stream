/**
 * @fileoverview Punto de entrada para todos los hooks de la aplicación.
 * Facilita las importaciones centralizadas.
 */

// Re-exportar hooks existentes
export { useAuth } from "./useAuth";
export { useFollow } from "./useFollow";
export { useFavorites } from "./useFavorites";
export { usePlaylists } from "./usePlaylists";
export { useNotifications } from "./useNotifications";
export { useArtists } from "./useArtists";
export { useAuditLog } from "./useAuditLog";
export { useContentAccess } from "./useContentAccess";
export { useContentByCreatorProfile } from "./useContentByCreatorProfile";
export { useCountryDetection } from "./useCountryDetection";
export { useFollowedProfiles } from "./useFollowedProfiles";
export { useNetworkStatus } from "./useNetworkStatus";
export { useServiceWorker } from "./useServiceWorker";
export { useThumbnailPreload } from "./useThumbnailPreload";
export { useUnreadMessages } from "./useUnreadMessages";
export { useUserBadges } from "./useUserBadges";
export { useUserSearch } from "./useUserSearch";
export { useScrollAnimation } from "./useScrollAnimation";
export { useToast, toast } from "./use-toast";
export { useIsMobile } from "./use-mobile";

// Nuevos hooks modularizados
export { useAppBuilder } from "./useAppBuilder";

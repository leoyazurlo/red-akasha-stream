/**
 * Storage Service Configuration
 * Centralized constants for storage providers and file handling
 */

export type StorageProvider = 'supabase' | 'cloudflare-r2' | 'aws-s3';

/** Active storage provider — change via VITE_STORAGE_PROVIDER env var */
export const STORAGE_PROVIDER: StorageProvider =
  (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase';

/** Bucket mapping per media type */
export const STORAGE_BUCKETS: Record<string, string> = {
  video: 'content-videos',
  audio: 'content-audios',
  image: 'profile-avatars',
  photo: 'content-photos',
  upload: 'content-uploads',
};

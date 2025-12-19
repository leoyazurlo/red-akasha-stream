/**
 * Storage validation utilities for file uploads
 * Enforces file size limits and type validation to prevent storage abuse
 */

export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,    // 10MB
  VIDEO: 1024 * 1024 * 1024,  // 1GB
  AUDIO: 50 * 1024 * 1024,    // 50MB
} as const;

// Límites de cantidad por perfil
export const FILE_COUNT_LIMITS = {
  PHOTOS: 10,   // Máximo 10 fotos
  VIDEOS: 10,   // Máximo 10 videos
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/flac'],
} as const;

export const FILE_EXTENSIONS = {
  IMAGE: ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'],
  VIDEO: ['MP4', 'WEBM', 'OGG', 'MOV', 'MKV'],
  AUDIO: ['MP3', 'WAV', 'OGG', 'AAC', 'M4A', 'FLAC'],
} as const;

export type MediaType = 'image' | 'video' | 'audio';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get human-readable file requirements
 */
export function getFileRequirements(mediaType: MediaType): {
  maxSize: string;
  formats: string;
  maxSizeBytes: number;
} {
  const sizeLimit = FILE_SIZE_LIMITS[mediaType.toUpperCase() as keyof typeof FILE_SIZE_LIMITS];
  const extensions = FILE_EXTENSIONS[mediaType.toUpperCase() as keyof typeof FILE_EXTENSIONS];
  const limitMB = Math.round(sizeLimit / (1024 * 1024));
  
  return {
    maxSize: `${limitMB}MB`,
    formats: extensions.join(', '),
    maxSizeBytes: sizeLimit
  };
}

/**
 * Validates a file against size and type constraints
 */
export function validateFile(
  file: File,
  mediaType: MediaType
): FileValidationResult {
  // Get limits and allowed types for this media type
  const sizeLimit = FILE_SIZE_LIMITS[mediaType.toUpperCase() as keyof typeof FILE_SIZE_LIMITS];
  const allowedTypes = ALLOWED_FILE_TYPES[mediaType.toUpperCase() as keyof typeof ALLOWED_FILE_TYPES];
  
  // Check file size
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / (1024 * 1024));
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `El archivo es demasiado grande (${fileSizeMB}MB). El tamaño máximo permitido es ${limitMB}MB.`
    };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const isValidType = allowedTypes.some(type => type === file.type);
  
  if (!isValidType) {
    const extensions = FILE_EXTENSIONS[mediaType.toUpperCase() as keyof typeof FILE_EXTENSIONS];
    return {
      valid: false,
      error: `Formato no permitido${fileExtension ? ` (.${fileExtension})` : ''}. Formatos aceptados: ${extensions.join(', ')}`
    };
  }
  
  // Check if file has content
  if (file.size === 0) {
    return {
      valid: false,
      error: 'El archivo está vacío. Por favor selecciona un archivo válido.'
    };
  }
  
  return { valid: true };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

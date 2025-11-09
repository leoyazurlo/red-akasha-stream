/**
 * Storage validation utilities for file uploads
 * Enforces file size limits and type validation to prevent storage abuse
 */

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,    // 5MB
  VIDEO: 50 * 1024 * 1024,   // 50MB
  AUDIO: 10 * 1024 * 1024,   // 10MB
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a'],
} as const;

export type MediaType = 'image' | 'video' | 'audio';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
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
    return {
      valid: false,
      error: `El archivo es demasiado grande. El tamaño máximo para ${mediaType === 'image' ? 'imágenes' : mediaType === 'video' ? 'videos' : 'audios'} es ${limitMB}MB.`
    };
  }
  
  // Check file type
  const isValidType = allowedTypes.some(type => type === file.type);
  if (!isValidType) {
    const typesList = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se aceptan: ${typesList}`
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

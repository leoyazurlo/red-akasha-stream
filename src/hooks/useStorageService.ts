import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_PROVIDER, STORAGE_BUCKETS, type StorageProvider } from "@/lib/storage-config";
import { validateFile, type MediaType, type FileValidationResult } from "@/lib/storage-validation";

export interface UploadOptions {
  /** Media type determines bucket & validation rules */
  mediaType: MediaType;
  /** Override the default bucket for this media type */
  bucket?: string;
  /** Optional subfolder inside the bucket */
  folder?: string;
  /** Cache-Control header value (default '3600') */
  cacheControl?: string;
}

export interface UploadResult {
  publicUrl: string;
  path: string;
  provider: StorageProvider;
}

/**
 * Centralised storage hook.
 * All upload components should use this instead of calling supabase.storage directly.
 *
 * To swap providers in the future, implement the corresponding branch
 * inside `uploadFile` keyed on `STORAGE_PROVIDER`.
 */
export function useStorageService() {
  /**
   * Validate a file without uploading.
   */
  const validate = useCallback(
    (file: File, mediaType: MediaType): FileValidationResult => {
      return validateFile(file, mediaType);
    },
    []
  );

  /**
   * Upload a file to the configured storage provider.
   * Returns the public URL of the uploaded file.
   */
  const uploadFile = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadResult> => {
      const { mediaType, bucket, cacheControl = "3600" } = options;

      // 1. Validate
      const validation = validateFile(file, mediaType);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. Auth check
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debes iniciar sesión para subir archivos");
      }

      // 3. Build path
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const folder = options.folder ? `${options.folder}/` : "";
      const filePath = `${user.id}/${folder}${timestamp}_${random}.${fileExt}`;

      // 4. Provider dispatch
      const targetBucket =
        bucket || STORAGE_BUCKETS[mediaType] || "content-uploads";

      switch (STORAGE_PROVIDER) {
        case "supabase":
        default: {
          const { data, error } = await supabase.storage
            .from(targetBucket)
            .upload(filePath, file, { cacheControl, upsert: false });

          if (error) throw error;

          const {
            data: { publicUrl },
          } = supabase.storage.from(targetBucket).getPublicUrl(data.path);

          return { publicUrl, path: data.path, provider: "supabase" };
        }

        // Future providers — uncomment & implement when needed:
        // case 'cloudflare-r2': { … }
        // case 'aws-s3': { … }
      }
    },
    []
  );

  /**
   * Save file metadata to the user_media_library table.
   */
  const saveToLibrary = useCallback(
    async (params: {
      mediaType: MediaType;
      publicUrl: string;
      fileName: string;
      fileSize: number;
      durationSeconds?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const folderMap: Record<string, string> = {
        video: "Videos",
        audio: "Audios",
        image: "Imágenes",
      };

      await supabase.from("user_media_library").insert({
        user_id: user.id,
        media_type: params.mediaType,
        file_url: params.publicUrl,
        file_name: params.fileName,
        file_size: params.fileSize,
        duration_seconds: params.durationSeconds ?? null,
        tags: [params.mediaType],
        folder: folderMap[params.mediaType] || "Otros",
      });
    },
    []
  );

  /**
   * Delete a file from storage.
   */
  const deleteFile = useCallback(
    async (path: string, bucket: string) => {
      switch (STORAGE_PROVIDER) {
        case "supabase":
        default: {
          const { error } = await supabase.storage.from(bucket).remove([path]);
          if (error) throw error;
        }
      }
    },
    []
  );

  return {
    provider: STORAGE_PROVIDER,
    validate,
    uploadFile,
    saveToLibrary,
    deleteFile,
  };
}

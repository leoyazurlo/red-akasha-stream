import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Supabase storage bucket */
  bucket: string;
  /** Path inside the bucket */
  path: string;
}

/**
 * Renders an image from a private Supabase Storage bucket.
 * Creates a signed URL using the current session token.
 */
export const AuthenticatedImage: React.FC<Props> = ({
  bucket,
  path,
  alt = "",
  className,
  ...rest
}) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let revoke: (() => void) | undefined;

    const load = async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour

      if (error || !data?.signedUrl) return;
      setSrc(data.signedUrl);
    };

    load();

    return () => {
      revoke?.();
    };
  }, [bucket, path]);

  if (!src) {
    return <Skeleton className={className} />;
  }

  return <img src={src} alt={alt} className={className} {...rest} />;
};

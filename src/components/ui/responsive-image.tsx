import { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  srcSmall?: string | null;
  srcMedium?: string | null;
  srcLarge?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
}

export const ResponsiveImage = ({
  src,
  srcSmall,
  srcMedium,
  srcLarge,
  alt,
  sizes = '(max-width: 640px) 320px, (max-width: 1024px) 640px, 1280px',
  className,
  ...props
}: ResponsiveImageProps) => {
  // Build srcset from available sources
  const srcset: string[] = [];
  
  if (srcSmall) {
    srcset.push(`${srcSmall} 320w`);
  }
  if (srcMedium) {
    srcset.push(`${srcMedium} 640w`);
  }
  if (srcLarge) {
    srcset.push(`${srcLarge} 1280w`);
  }
  
  // Fallback to main src if no responsive sources
  const finalSrcSet = srcset.length > 0 ? srcset.join(', ') : undefined;
  const finalSrc = srcLarge || srcMedium || srcSmall || src;

  return (
    <img
      src={finalSrc}
      srcSet={finalSrcSet}
      sizes={finalSrcSet ? sizes : undefined}
      alt={alt}
      className={cn('', className)}
      {...props}
    />
  );
};

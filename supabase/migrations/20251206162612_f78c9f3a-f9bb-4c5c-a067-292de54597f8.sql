-- Add new artist types to the enum
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'musico';
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'percusion';
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'agrupacion';
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'dj';
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'vj';
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'danza';
ALTER TYPE public.artist_type ADD VALUE IF NOT EXISTS 'fotografia_digital';
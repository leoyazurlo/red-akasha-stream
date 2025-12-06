-- Add missing profile types to the enum
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'danza';
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'percusion';
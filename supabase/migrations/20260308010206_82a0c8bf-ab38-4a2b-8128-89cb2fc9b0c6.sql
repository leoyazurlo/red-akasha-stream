ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_collaborative boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.playlist_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  added_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, user_id)
);

ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playlist owner manages collaborators"
  ON public.playlist_collaborators FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Collaborators can view own entries"
  ON public.playlist_collaborators FOR SELECT TO authenticated
  USING (user_id = auth.uid());
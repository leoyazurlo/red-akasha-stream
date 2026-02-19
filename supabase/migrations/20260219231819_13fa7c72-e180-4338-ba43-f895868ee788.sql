
-- Chapters/Markers for content
CREATE TABLE public.content_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content_uploads(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chapters"
  ON public.content_chapters FOR SELECT USING (true);

CREATE POLICY "Content owner can manage chapters"
  ON public.content_chapters FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.content_uploads WHERE id = content_id AND uploader_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Creator can delete own chapters"
  ON public.content_chapters FOR DELETE
  USING (created_by = auth.uid());

CREATE INDEX idx_content_chapters_content ON public.content_chapters(content_id, timestamp_seconds);

-- Synchronized lyrics for content
CREATE TABLE public.content_lyrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content_uploads(id) ON DELETE CASCADE,
  timestamp_seconds NUMERIC(10,2) NOT NULL,
  text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_lyrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lyrics"
  ON public.content_lyrics FOR SELECT USING (true);

CREATE POLICY "Content owner can manage lyrics"
  ON public.content_lyrics FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.content_uploads WHERE id = content_id AND uploader_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Creator can delete own lyrics"
  ON public.content_lyrics FOR DELETE
  USING (created_by = auth.uid());

CREATE INDEX idx_content_lyrics_content ON public.content_lyrics(content_id, timestamp_seconds);

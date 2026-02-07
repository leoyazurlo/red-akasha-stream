-- Add read policy for akasha-ia-files bucket so users can view their own files
CREATE POLICY "Users can read own akasha-ia-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'akasha-ia-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Add insert policy for akasha-ia-files bucket
CREATE POLICY "Users can upload akasha-ia-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'akasha-ia-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Add update policy for akasha-ia-files bucket
CREATE POLICY "Users can update own akasha-ia-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'akasha-ia-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
-- Add CHECK constraints for profile_details table
ALTER TABLE profile_details
  -- Display name must be between 2 and 100 characters
  ADD CONSTRAINT check_display_name_length 
    CHECK (char_length(display_name) BETWEEN 2 AND 100),
  
  -- Bio max 500 characters (nullable)
  ADD CONSTRAINT check_bio_length 
    CHECK (bio IS NULL OR char_length(bio) <= 500),
  
  -- Email format validation (nullable)
  ADD CONSTRAINT check_email_format 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  
  -- Phone number format validation (nullable)
  ADD CONSTRAINT check_telefono_format 
    CHECK (telefono IS NULL OR telefono ~* '^[+]?[0-9\s\-()]{7,20}$'),
  
  -- WhatsApp format validation (nullable)
  ADD CONSTRAINT check_whatsapp_format 
    CHECK (whatsapp IS NULL OR whatsapp ~* '^[+]?[0-9\s\-()]{7,20}$'),
  
  -- Instagram: must be valid username or URL (nullable)
  ADD CONSTRAINT check_instagram_format 
    CHECK (instagram IS NULL OR 
           instagram ~* '^(@?[A-Za-z0-9._]{1,30}|https?://(www\.)?instagram\.com/.+)$'),
  
  -- Facebook: must be valid URL or username (nullable)
  ADD CONSTRAINT check_facebook_format 
    CHECK (facebook IS NULL OR 
           char_length(facebook) <= 200),
  
  -- LinkedIn: must be valid URL or username (nullable)
  ADD CONSTRAINT check_linkedin_format 
    CHECK (linkedin IS NULL OR 
           char_length(linkedin) <= 200),
  
  -- Country: required, reasonable length
  ADD CONSTRAINT check_pais_length 
    CHECK (char_length(pais) BETWEEN 2 AND 100),
  
  -- City: required, reasonable length
  ADD CONSTRAINT check_ciudad_length 
    CHECK (char_length(ciudad) BETWEEN 2 AND 100);

-- Add CHECK constraints for content_uploads table
ALTER TABLE content_uploads
  -- Title: required, between 1 and 200 characters
  ADD CONSTRAINT check_title_length 
    CHECK (char_length(title) BETWEEN 1 AND 200),
  
  -- Description: max 1000 characters (nullable)
  ADD CONSTRAINT check_description_length 
    CHECK (description IS NULL OR char_length(description) <= 1000),
  
  -- Video URL: must be valid http/https URL, no localhost/internal IPs (nullable)
  ADD CONSTRAINT check_video_url_format 
    CHECK (video_url IS NULL OR (
      video_url ~* '^https?://' AND
      video_url !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
    )),
  
  -- Photo URL: must be valid http/https URL, no localhost/internal IPs (nullable)
  ADD CONSTRAINT check_photo_url_format 
    CHECK (photo_url IS NULL OR (
      photo_url ~* '^https?://' AND
      photo_url !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
    )),
  
  -- Audio URL: must be valid http/https URL, no localhost/internal IPs (nullable)
  ADD CONSTRAINT check_audio_url_format 
    CHECK (audio_url IS NULL OR (
      audio_url ~* '^https?://' AND
      audio_url !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
    )),
  
  -- Thumbnail URL: must be valid http/https URL, no localhost/internal IPs (nullable)
  ADD CONSTRAINT check_thumbnail_url_format 
    CHECK (thumbnail_url IS NULL OR (
      thumbnail_url ~* '^https?://' AND
      thumbnail_url !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
    )),
  
  -- Band name: reasonable length (nullable)
  ADD CONSTRAINT check_band_name_length 
    CHECK (band_name IS NULL OR char_length(band_name) BETWEEN 1 AND 200),
  
  -- Producer name: reasonable length (nullable)
  ADD CONSTRAINT check_producer_name_length 
    CHECK (producer_name IS NULL OR char_length(producer_name) BETWEEN 1 AND 200),
  
  -- Promoter name: reasonable length (nullable)
  ADD CONSTRAINT check_promoter_name_length 
    CHECK (promoter_name IS NULL OR char_length(promoter_name) BETWEEN 1 AND 200),
  
  -- Venue name: reasonable length (nullable)
  ADD CONSTRAINT check_venue_name_length 
    CHECK (venue_name IS NULL OR char_length(venue_name) BETWEEN 1 AND 200),
  
  -- Recording studio: reasonable length (nullable)
  ADD CONSTRAINT check_recording_studio_length 
    CHECK (recording_studio IS NULL OR char_length(recording_studio) BETWEEN 1 AND 200);
CREATE OR REPLACE FUNCTION track_download_secure(p_note_id UUID)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    -- Check if already downloaded by this user
    SELECT EXISTS (
      SELECT 1 FROM public.downloads 
      WHERE note_id = p_note_id AND user_id = v_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
      -- Already downloaded, do not increment
      RETURN;
    END IF;
    
    -- Insert into downloads to track history
    INSERT INTO public.downloads (note_id, user_id) VALUES (p_note_id, v_user_id);
  END IF;

  -- Increment the global counter
  UPDATE public.notes
  SET downloads_count = COALESCE(downloads_count, 0) + 1
  WHERE id = p_note_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

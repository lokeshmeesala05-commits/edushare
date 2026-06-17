-- 1. Create a secure function to increment downloads, bypassing RLS
CREATE OR REPLACE FUNCTION increment_download(note_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notes
  SET downloads_count = COALESCE(downloads_count, 0) + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow authenticated users to insert into the downloads table
CREATE POLICY "Authenticated users can insert downloads" 
ON public.downloads FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

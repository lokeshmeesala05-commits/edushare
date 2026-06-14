-- Temporary policies to allow uploads without being logged in (for development)

-- Allow anonymous inserts to the notes table
CREATE POLICY "Allow anon uploads to notes" 
ON public.notes 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow everyone to upload files to the 'notes' storage bucket
CREATE POLICY "Allow public uploads to notes bucket" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'notes');

-- Allow everyone to read files from the 'notes' storage bucket
CREATE POLICY "Allow public read from notes bucket" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'notes');

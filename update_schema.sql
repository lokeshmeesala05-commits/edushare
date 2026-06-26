-- ==========================================
-- UPDATE SCHEMA FOR EDUSHARE NEW FEATURES
-- ==========================================
-- Copy and paste this into the Supabase SQL Editor and run it.
-- It will safely add the missing tables and columns without affecting existing data.

-- 1. Ensure `notes` table has `downloads_count`
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0;

-- 2. Create `note_requests` table
CREATE TABLE IF NOT EXISTS public.note_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requested_title TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    requested_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'fulfilled', 'closed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create `search_logs` table
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT,
    class_name TEXT,
    subject TEXT,
    results_found_count INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create `downloads` table
CREATE TABLE IF NOT EXISTS public.downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RPC function to safely increment note downloads count atomically
CREATE OR REPLACE FUNCTION increment_download_count(note_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notes 
    SET downloads_count = COALESCE(downloads_count, 0) + 1 
    WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE public.note_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Note Requests Policies
DO $$ BEGIN
    CREATE POLICY "Anyone can view note requests" ON public.note_requests FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can create requests" ON public.note_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update note requests" ON public.note_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Search Logs Policies
DO $$ BEGIN
    CREATE POLICY "Anyone can insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view search logs" ON public.search_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Downloads Policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own downloads" ON public.downloads FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all downloads" ON public.downloads FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can insert downloads" ON public.downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

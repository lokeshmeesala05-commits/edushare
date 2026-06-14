-- Supabase Schema for EduShare

-- 1. Create Users Table (extends Supabase Auth)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    school_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Notes Table
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter TEXT,
    language TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Note Requests Table
CREATE TABLE public.note_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requested_title TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('open', 'fulfilled')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Search Logs Table (for Resource Gap Detection)
CREATE TABLE public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT NOT NULL,
    class_name TEXT,
    subject TEXT,
    results_found INTEGER NOT NULL,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Downloads Table (for Analytics & Tracking)
CREATE TABLE public.downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Ratings Table
CREATE TABLE public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    UNIQUE(note_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Basic Policies (These can be refined later for tighter security)

-- Users can read all users (needed for community features), but only update their own profile
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Notes policies
CREATE POLICY "Anyone can view approved notes" ON public.notes FOR SELECT USING (approval_status = 'approved');
CREATE POLICY "Users can view their own pending notes" ON public.notes FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Admins can view all notes" ON public.notes FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authenticated users can upload notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Admins can update notes" ON public.notes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Note Requests policies
CREATE POLICY "Anyone can view note requests" ON public.note_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create requests" ON public.note_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

-- Search Logs policies
CREATE POLICY "Anyone can insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view search logs" ON public.search_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Storage configuration
-- IMPORTANT: You will need to create a storage bucket named 'notes' manually in the Supabase Dashboard, 
-- and make it 'Public'.

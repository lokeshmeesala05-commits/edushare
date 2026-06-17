-- Add doc_type column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS doc_type TEXT DEFAULT 'notes';

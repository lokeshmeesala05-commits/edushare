-- Add rejection_reason column to notes table
ALTER TABLE public.notes ADD COLUMN rejection_reason TEXT;

-- Enable delete policies for note_requests

-- Drop existing delete policies if they exist (just to be safe)
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.note_requests;
DROP POLICY IF EXISTS "Admins can delete any request" ON public.note_requests;

-- Allow users to delete their own requests
CREATE POLICY "Users can delete their own requests" 
ON public.note_requests 
FOR DELETE 
USING (auth.uid() = requested_by);

-- Allow admins to delete any request
CREATE POLICY "Admins can delete any request" 
ON public.note_requests 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

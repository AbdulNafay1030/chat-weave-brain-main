-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- Create a proper policy that allows anonymous inserts
CREATE POLICY "Allow anonymous waitlist signup" 
ON public.waitlist 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);
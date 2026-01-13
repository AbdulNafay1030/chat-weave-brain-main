-- Create waitlist table to store signups
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  join_number INTEGER NOT NULL DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public waitlist signup)
CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Only allow admins/service role to view waitlist (not public)
CREATE POLICY "Waitlist is private" 
ON public.waitlist 
FOR SELECT 
USING (false);

-- Create function to auto-increment join_number
CREATE OR REPLACE FUNCTION public.set_waitlist_join_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.join_number := COALESCE((SELECT MAX(join_number) FROM public.waitlist), 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to set join_number before insert
CREATE TRIGGER set_waitlist_join_number_trigger
BEFORE INSERT ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.set_waitlist_join_number();
-- Add foreign key for invited_by to profiles table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitations_invited_by_fkey'
  ) THEN
    ALTER TABLE public.invitations 
    ADD CONSTRAINT invitations_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Allow users to view invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email"
ON public.invitations
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
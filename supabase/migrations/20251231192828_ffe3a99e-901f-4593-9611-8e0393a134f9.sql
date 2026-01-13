-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.invitations;

-- Recreate the policy using profiles table instead
CREATE POLICY "Users can view invitations sent to their email"
ON public.invitations
FOR SELECT
USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
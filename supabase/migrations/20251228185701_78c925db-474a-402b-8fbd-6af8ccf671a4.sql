-- Fix publish-blocking security finding: restrict profiles visibility (emails live in profiles)
-- Replace overly-permissive SELECT policy on public.profiles

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in shared groups"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm_me
    JOIN public.group_members gm_other
      ON gm_other.group_id = gm_me.group_id
    WHERE gm_me.user_id = auth.uid()
      AND gm_other.user_id = profiles.id
  )
);

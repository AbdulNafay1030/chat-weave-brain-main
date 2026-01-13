-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group members can add new members" ON public.group_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.group_members;

-- Recreate policies using the security definer function or direct checks
CREATE POLICY "Users can view group members for their groups" 
ON public.group_members 
FOR SELECT 
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can add new members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  public.is_group_member(auth.uid(), group_id) 
  OR (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ))
);

CREATE POLICY "Owners can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
  OR user_id = auth.uid()
);

-- Also fix the groups SELECT policy which references group_members
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of" 
ON public.groups 
FOR SELECT 
USING (public.is_group_member(auth.uid(), id) OR owner_id = auth.uid());

-- Fix messages policies
DROP POLICY IF EXISTS "Group members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;

CREATE POLICY "Group members can view messages" 
ON public.messages 
FOR SELECT 
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.is_group_member(auth.uid(), group_id));

-- Fix invitations policy
DROP POLICY IF EXISTS "Group members can create invitations" ON public.invitations;
CREATE POLICY "Group members can create invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (auth.uid() = invited_by AND public.is_group_member(auth.uid(), group_id));